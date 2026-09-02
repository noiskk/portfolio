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

import java.util.ArrayList;
import java.util.List;

/**
 * 운영 청킹 설정(500/100)에서 질문별 최고 유사도 점수를 출력한다.
 * 스윕이 알려준 "임계값을 어디에 둘지"를 질문 단위로 확인하기 위한 진단.
 *
 * 실행: RUN_EVAL=true ./gradlew test --tests '*RetrievalDiagnosisTest*'
 */
@SpringBootTest(properties = {"portfolio.rag.ingest-on-startup=false"})
@EnabledIfEnvironmentVariable(named = "RUN_EVAL", matches = "true")
class RetrievalDiagnosisTest {

    @Autowired private VectorStore vectorStore;
    @Autowired private QdrantClient qdrantClient;

    @Test
    void perQuestionScores() throws Exception {
        // 운영과 동일한 청킹으로 재색인
        try { qdrantClient.deleteCollectionAsync("portfolio").get(); } catch (Exception ignored) {}
        qdrantClient.createCollectionAsync("portfolio",
                VectorParams.newBuilder().setSize(1536).setDistance(Distance.Cosine).build()).get();

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        List<Resource> resources = new ArrayList<>();
        for (String p : new String[]{"classpath:documents/*.md", "classpath:readmes/*.md"}) {
            resources.addAll(List.of(resolver.getResources(p)));
        }
        TokenTextSplitter splitter = new TokenTextSplitter(500, 100, 5, 10000, true);
        List<Document> all = new ArrayList<>();
        for (Resource r : resources) {
            String filename = r.getFilename();
            String folder = r.getURI().toString().contains("/readmes/") ? "readmes" : "documents";
            TextReader reader = new TextReader(r);
            reader.getCustomMetadata().put("source", filename);
            reader.getCustomMetadata().put("folder", folder);
            List<Document> chunks = splitter.apply(reader.get());
            chunks.forEach(c -> { c.getMetadata().put("source", filename); c.getMetadata().put("folder", folder); });
            all.addAll(chunks);
        }
        vectorStore.add(all);

        JsonNode golden = new ObjectMapper().readTree(
                new ClassPathResource("eval/golden-set.json").getInputStream());

        System.out.println("\n===DIAG_START===");
        System.out.println("TYPE\tTOP1\tEXPECTED_BEST\tTOP1_SRC\tEXPECTED\tQUESTION");

        for (JsonNode n : golden.get("positives")) {
            String q = n.get("question").asText();
            List<String> expected = new ArrayList<>();
            n.get("expected").forEach(e -> expected.add(e.asText()));
            List<Document> docs = raw(q);
            double top1 = docs.isEmpty() ? 0 : docs.get(0).getScore();
            String top1src = docs.isEmpty() ? "-" : String.valueOf(docs.get(0).getMetadata().get("source"));
            // 기대 출처가 받은 최고 점수 (검색 상위 10 안에 있다면)
            double expBest = 0;
            for (Document d : docs) {
                if (expected.contains(String.valueOf(d.getMetadata().get("source")))) {
                    expBest = Math.max(expBest, d.getScore());
                }
            }
            System.out.printf("POS\t%.4f\t%.4f\t%s\t%s\t%s%n", top1, expBest, top1src, String.join(",", expected), q);
        }

        for (JsonNode n : golden.get("negatives")) {
            String q = n.asText();
            List<Document> docs = raw(q);
            double top1 = docs.isEmpty() ? 0 : docs.get(0).getScore();
            String top1src = docs.isEmpty() ? "-" : String.valueOf(docs.get(0).getMetadata().get("source"));
            System.out.printf("NEG\t%.4f\t-\t%s\t-\t%s%n", top1, top1src, q);
        }
        System.out.println("===DIAG_END===\n");
    }

    private List<Document> raw(String query) {
        return vectorStore.similaritySearch(SearchRequest.builder()
                .query(query).topK(10)
                .similarityThreshold(SearchRequest.SIMILARITY_THRESHOLD_ACCEPT_ALL).build());
    }
}
