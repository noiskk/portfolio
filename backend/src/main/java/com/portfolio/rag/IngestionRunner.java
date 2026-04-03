package com.portfolio.rag;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * RAG Indexing Phase - Step 1: Qdrant 컬렉션 초기화
 *
 * 앱 시작 시 자동 실행 (@Order(2) → DataInitializer 다음).
 * 컬렉션을 매번 삭제 후 재생성하는 이유:
 *   - 문서 수정 시 중복 벡터 누적 없이 즉시 반영 가능
 *   - 개발 단계에서 항상 최신 문서 상태 유지
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class IngestionRunner implements ApplicationRunner {

    private final DocumentIngester documentIngester;
    private final QdrantClient qdrantClient;

    private static final String COLLECTION_NAME = "portfolio";

    // text-embedding-3-small 모델의 출력 차원 수
    // 텍스트 하나를 1536개의 숫자(벡터)로 표현
    private static final int EMBEDDING_DIMENSIONS = 1536;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("Recreating collection '{}'...", COLLECTION_NAME);

        // 기존 컬렉션 삭제 (없으면 예외 무시)
        try {
            qdrantClient.deleteCollectionAsync(COLLECTION_NAME).get();
            log.info("Existing collection deleted.");
        } catch (Exception e) {
            log.info("Collection not found, will create new.");
        }

        // 새 컬렉션 생성
        // - size: 벡터 차원 수 (임베딩 모델과 반드시 일치해야 함)
        // - distance: 유사도 계산 방식 (Cosine = 벡터 간 각도 기반)
        qdrantClient.createCollectionAsync(
            COLLECTION_NAME,
            VectorParams.newBuilder()
                .setSize(EMBEDDING_DIMENSIONS)
                .setDistance(Distance.Cosine)
                .build()
        ).get();
        log.info("Collection '{}' created.", COLLECTION_NAME);

        // Step 2로 넘김: 문서 읽기 → 청킹 → 임베딩 → Qdrant 저장
        log.info("Starting document ingestion...");
        documentIngester.ingestAll();
    }
}
