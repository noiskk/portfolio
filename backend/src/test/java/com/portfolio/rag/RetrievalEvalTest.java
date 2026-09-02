package com.portfolio.rag;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.TextReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 검색 파라미터 스윕 평가
 *
 * 목적: 청크 크기·Top-K·유사도 임계값을 바꿨을 때 검색 품질이 어떻게 변하는지 측정한다.
 *
 * 측정 지표
 *   - Hit    : 기대 출처 문서가 검색 결과에 포함된 질문의 비율 (높을수록 좋음)
 *   - MRR    : 기대 출처가 몇 번째로 나왔는지의 역수 평균 (1.0이 최선)
 *   - Reject : 무관한 질문에서 검색 결과가 0건이 된 비율 (높을수록 환각 차단)
 *   - AvgDoc : 질문당 평균 반환 청크 수 (프롬프트 비용에 비례)
 *
 * 설계 메모:
 *   Top-K와 임계값은 벡터를 바꾸지 않고 결과를 자르는 후처리다.
 *   그래서 청크 설정마다 임베딩을 한 번만 하고, 넉넉한 K로 원본 결과를 받아둔 뒤
 *   Top-K·임계값 조합은 메모리에서 계산한다. 임베딩 호출을 조합 수만큼 반복하지 않기 위함.
 *
 * 실행: RUN_EVAL=true ./gradlew test --tests '*RetrievalEvalTest*'
 * (환경변수가 없으면 일반 빌드에서 건너뛴다 — 외부 API 비용이 드는 테스트이므로)
 */
@SpringBootTest(properties = {
        "portfolio.rag.ingest-on-startup=false"   // 기동 시 자동 색인 비활성화 (평가에서 직접 색인)
})
@EnabledIfEnvironmentVariable(named = "RUN_EVAL", matches = "true")
class RetrievalEvalTest {

    @Autowired
    private VectorStore vectorStore;

    @Autowired
    private QdrantClient qdrantClient;

    private static final String COLLECTION = "portfolio";
    private static final int DIMENSIONS = 1536;

    /** 스윕할 청킹 설정: {maxTokens, overlap} */
    private static final int[][] CHUNK_CONFIGS = {
            {300, 50}, {500, 100}, {800, 150}, {1200, 200}
    };
    private static final int[] TOP_KS = {2, 3, 4, 6, 8};
    private static final double[] THRESHOLDS = {0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60};

    /** 원본 결과를 받을 때 쓰는 K. 스윕할 Top-K의 최대값 이상이어야 한다. */
    private static final int RAW_TOP_K = 10;

    private record Hit(String source, double score) {}
    private record Positive(String question, List<String> expected) {}
    private record Metrics(double hit, double mrr, double reject, double avgDoc) {}

    @Test
    void sweepRetrievalParameters() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode golden = mapper.readTree(new ClassPathResource("eval/golden-set.json").getInputStream());

        List<Positive> positives = new ArrayList<>();
        golden.get("positives").forEach(node -> {
            List<String> expected = new ArrayList<>();
            node.get("expected").forEach(e -> expected.add(e.asText()));
            positives.add(new Positive(node.get("question").asText(), expected));
        });

        List<String> negatives = new ArrayList<>();
        golden.get("negatives").forEach(n -> negatives.add(n.asText()));

        StringBuilder report = new StringBuilder();
        report.append("# 검색 파라미터 스윕 결과\n\n")
              .append("- 관련 질문 ").append(positives.size()).append("개, 무관 질문 ").append(negatives.size()).append("개\n")
              .append("- Hit: 기대 출처가 검색된 비율 / MRR: 기대 출처 순위의 역수 평균\n")
              .append("- Reject: 무관 질문에서 결과 0건이 된 비율 / AvgDoc: 질문당 평균 반환 청크 수\n\n");

        for (int[] chunkConfig : CHUNK_CONFIGS) {
            int size = chunkConfig[0];
            int overlap = chunkConfig[1];

            int chunkCount = reindex(size, overlap);

            // 청크 설정 하나당 임베딩은 여기서 한 번만. 이후 조합은 이 결과를 잘라서 계산한다.
            Map<String, List<Hit>> rawResults = new LinkedHashMap<>();
            for (Positive p : positives) rawResults.put(p.question(), search(p.question()));
            for (String n : negatives) rawResults.put(n, search(n));

            report.append("## 청크 ").append(size).append("토큰 / overlap ").append(overlap)
                  .append(" — 총 ").append(chunkCount).append("청크\n\n")
                  .append("| Top-K | 임계값 | Hit | MRR | Reject | AvgDoc |\n")
                  .append("|---|---|---|---|---|---|\n");

            for (int topK : TOP_KS) {
                for (double threshold : THRESHOLDS) {
                    Metrics m = evaluate(positives, negatives, rawResults, topK, threshold);
                    report.append(String.format("| %d | %.2f | %.3f | %.3f | %.3f | %.2f |%n",
                            topK, threshold, m.hit(), m.mrr(), m.reject(), m.avgDoc()));
                }
            }
            report.append('\n');

            System.out.printf("[eval] 청크 %d/%d 완료 — %d청크%n", size, overlap, chunkCount);
        }

        Path out = Path.of("build", "eval-report.md");
        Files.createDirectories(out.getParent());
        Files.writeString(out, report.toString());
        System.out.println("[eval] 리포트 저장: " + out.toAbsolutePath());
        System.out.println(report);
    }

    /** 컬렉션을 비우고 주어진 청킹 설정으로 전체 재색인. 생성된 청크 수를 반환한다. */
    private int reindex(int maxTokens, int overlap) throws Exception {
        try {
            qdrantClient.deleteCollectionAsync(COLLECTION).get();
        } catch (Exception ignored) {
            // 컬렉션이 없으면 그대로 진행
        }
        qdrantClient.createCollectionAsync(COLLECTION,
                VectorParams.newBuilder().setSize(DIMENSIONS).setDistance(Distance.Cosine).build()).get();

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        List<Resource> resources = new ArrayList<>();
        for (String pattern : new String[]{"classpath:documents/*.md", "classpath:readmes/*.md"}) {
            resources.addAll(List.of(resolver.getResources(pattern)));
        }

        // 운영 코드(DocumentIngester)와 같은 절차. 청킹 설정만 파라미터로 받는다.
        TokenTextSplitter splitter = new TokenTextSplitter(maxTokens, overlap, 5, 10000, true);
        List<Document> allChunks = new ArrayList<>();
        for (Resource resource : resources) {
            String filename = resource.getFilename();
            String folder = resource.getURI().toString().contains("/readmes/") ? "readmes" : "documents";

            TextReader reader = new TextReader(resource);
            reader.getCustomMetadata().put("source", filename);
            reader.getCustomMetadata().put("folder", folder);

            List<Document> chunks = splitter.apply(reader.get());
            chunks.forEach(c -> {
                c.getMetadata().put("source", filename);
                c.getMetadata().put("folder", folder);
            });
            allChunks.addAll(chunks);
        }
        vectorStore.add(allChunks);
        return allChunks.size();
    }

    /** 임계값 없이 넉넉한 K로 원본 검색 결과를 받아온다. */
    private List<Hit> search(String query) {
        List<Document> docs = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(RAW_TOP_K)
                        .similarityThreshold(SearchRequest.SIMILARITY_THRESHOLD_ACCEPT_ALL)
                        .build());
        List<Hit> hits = new ArrayList<>();
        for (Document doc : docs) {
            Object source = doc.getMetadata().get("source");
            Double score = doc.getScore();
            hits.add(new Hit(source == null ? "?" : source.toString(), score == null ? 0.0 : score));
        }
        return hits;
    }

    private Metrics evaluate(List<Positive> positives, List<String> negatives,
                             Map<String, List<Hit>> rawResults, int topK, double threshold) {
        int hitCount = 0;
        double mrrSum = 0;
        int docSum = 0;

        for (Positive p : positives) {
            List<Hit> filtered = filter(rawResults.get(p.question()), topK, threshold);
            docSum += filtered.size();
            for (int i = 0; i < filtered.size(); i++) {
                if (p.expected().contains(filtered.get(i).source())) {
                    hitCount++;
                    mrrSum += 1.0 / (i + 1);
                    break;
                }
            }
        }

        int rejected = 0;
        for (String n : negatives) {
            if (filter(rawResults.get(n), topK, threshold).isEmpty()) rejected++;
        }

        int p = positives.size();
        return new Metrics(
                (double) hitCount / p,
                mrrSum / p,
                (double) rejected / negatives.size(),
                (double) docSum / p);
    }

    /** Qdrant에 topK·threshold를 준 것과 동일한 결과. 순위는 그대로이므로 앞에서 자르고 점수로 거른다. */
    private List<Hit> filter(List<Hit> hits, int topK, double threshold) {
        List<Hit> result = new ArrayList<>();
        for (Hit hit : hits.subList(0, Math.min(topK, hits.size()))) {
            if (hit.score() >= threshold) result.add(hit);
        }
        return result;
    }
}
