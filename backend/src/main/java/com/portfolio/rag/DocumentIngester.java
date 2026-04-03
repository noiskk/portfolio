package com.portfolio.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.TextReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * RAG Indexing Phase - Step 2: 문서 청킹 → 임베딩 → 벡터 저장
 *
 * [전체 흐름]
 *   documents/*.md + readmes/*.md
 *       → TextReader (원문 읽기)
 *       → TokenTextSplitter (청킹)
 *       → VectorStore.add() → OpenAI Embedding API → Qdrant 저장
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentIngester {

    // Spring AI가 제공하는 VectorStore 추상화
    // 내부적으로 OpenAI Embedding API 호출 후 Qdrant에 저장
    private final VectorStore vectorStore;

    // 임베딩 대상 경로: 챗봇 응답에 활용할 모든 md 파일
    // - documents/: 프로필, 기술 스택, 프로젝트 요약
    // - readmes/: 각 프로젝트 상세 README
    private static final String[] DOCUMENT_PATHS = {
        "classpath:documents/*.md",
        "classpath:readmes/*.md"
    };

    public void ingestAll() {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

            List<Resource> resourceList = new ArrayList<>();
            for (String pattern : DOCUMENT_PATHS) {
                Resource[] found = resolver.getResources(pattern);
                resourceList.addAll(Arrays.asList(found));
            }
            Resource[] resources = resourceList.toArray(new Resource[0]);

            if (resources.length == 0) {
                log.warn("No documents found in classpath:documents/");
                return;
            }

            List<Document> allDocs = new ArrayList<>();

            // 청킹 설정: TokenTextSplitter(maxTokens, overlap, minChunkSize, maxChunkSize, keepSeparator)
            // - 500토큰 단위로 자름
            // - 100토큰 overlap: 앞 청크와 겹치게 해서 문맥이 끊기지 않도록
            //   ex) "A B C D E" → ["A B C", "C D E"] (C가 겹침)
            TokenTextSplitter splitter = new TokenTextSplitter(500, 100, 5, 10000, true);

            for (Resource resource : resources) {
                log.info("Ingesting document: {}", resource.getFilename());

                String filename = resource.getFilename();
                String uri = resource.getURI().toString();
                String folder = uri.contains("/readmes/") ? "readmes" : "documents";

                // 파일 원문 읽기
                TextReader reader = new TextReader(resource);
                reader.getCustomMetadata().put("source", filename);
                reader.getCustomMetadata().put("folder", folder);
                List<Document> docs = reader.get();

                // 청킹: 1개 파일 → N개 Document 청크
                List<Document> chunks = splitter.apply(docs);

                // 각 청크에 출처 메타데이터 유지 (검색 결과 디버깅 시 활용)
                chunks.forEach(chunk -> {
                    chunk.getMetadata().put("source", filename);
                    chunk.getMetadata().put("folder", folder);
                });

                allDocs.addAll(chunks);
            }

            log.info("Adding {} document chunks to vector store...", allDocs.size());

            // 벡터 저장: 청크 텍스트 → OpenAI text-embedding-3-small → 1536차원 벡터 → Qdrant
            // Spring AI VectorStore가 임베딩 API 호출을 내부적으로 처리
            vectorStore.add(allDocs);
            log.info("Document ingestion complete.");

        } catch (IOException e) {
            log.error("Failed to ingest documents", e);
            throw new RuntimeException("Document ingestion failed", e);
        }
    }
}
