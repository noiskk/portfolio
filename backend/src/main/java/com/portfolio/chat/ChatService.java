package com.portfolio.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * RAG Retrieval + Generation Phase
 *
 * 질문 1개 처리 흐름:
 *   1. 세션에서 대화 히스토리 로드
 *   2. 검색 쿼리 보정 (후속 질문 대응)
 *   3. Qdrant 유사도 검색 → 임계값 이상 청크 Top-K 추출
 *   4. 프롬프트 조립: 시스템 + context + 히스토리 + 질문
 *   5. LLM 호출 → SSE 스트리밍 응답 (출처 이벤트 → 콘텐츠 이벤트 순)
 *   6. 히스토리 저장 (질문 + 응답)
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final ChatSessionStore sessionStore;
    private final ObjectMapper objectMapper;

    // 검색 상위 K개 청크만 프롬프트에 포함
    @Value("${portfolio.rag.top-k:4}")
    private int topK;

    // 유사도 임계값: 이 값 미만의 청크는 관련 없다고 보고 제외
    // 임계값이 없으면 "오늘 날씨는?" 같은 무관한 질문에도 아무 청크나 Top-K로 들어가
    // LLM이 엉뚱한 근거로 답변하게 됨
    //
    // 값 근거 (골든셋 22문항 + 무관 질문 8개 측정):
    //   무관 질문의 최고 유사도는 0.269 → 0.30이면 전부 차단된다.
    //   0.35에서는 차단 효과가 같은데 관련 문서만 9개 더 잘려 검색 성공률이 0.86 → 0.59로 떨어졌다.
    //   측정: RUN_EVAL=true ./gradlew test --tests '*RetrievalEvalTest*'
    @Value("${portfolio.rag.similarity-threshold:0.30}")
    private double similarityThreshold;

    // 시스템 프롬프트: LLM의 역할과 답변 방식 정의
    // %s 자리에 Qdrant에서 검색된 관련 문서 청크(context)가 들어감
    private static final String SYSTEM_PROMPT = """
            당신은 포트폴리오 사이트의 AI 어시스턴트입니다.
            방문자가 포트폴리오 주인에 대해 질문하면, 아래 제공된 정보를 바탕으로 친절하게 답변하세요.
            제공된 정보에 없는 내용은 "해당 정보는 확인이 어렵습니다. 직접 문의해 주세요." 라고 답하세요.
            표, 목록 등 형식 요청이 있으면 그 형식으로 답변하세요.
            답변은 자연스럽고 간결하게, 한국어로 작성하세요.

            [답변 수준 조절 원칙]
            - 질문이 넓고 일반적일수록 답변도 짧고 핵심만 담아야 합니다.
            - "어떤 프로젝트 했어요?", "소개해 주세요" 같은 질문은 프로젝트 이름과 한 줄 요약 정도만 답하세요.
            - 기술 스택, 구현 방식, 트러블슈팅 같은 세부 내용은 명시적으로 물어볼 때만 답하세요.
            - 답변 후 "더 궁금한 점이 있으시면 질문해 주세요" 같은 안내는 하지 마세요. 자연스럽게 끝내세요.

            [참고 정보]
            %s
            """;

    public Flux<ServerSentEvent<String>> chat(String sessionId, String userMessage) {

        // 1. 세션별 대화 히스토리 로드
        List<Message> history = sessionStore.getMessages(sessionId);

        // 2. 검색 쿼리 보정
        //    "그럼 검증은요?" 같은 짧은 후속 질문은 단독으로 검색하면 관련 문서를 못 찾을 수 있음
        //    → 이전 질문을 앞에 붙여서 의미 있는 쿼리로 만듦
        String searchQuery = buildSearchQuery(userMessage, history);

        // 3. Retrieval: 질문을 벡터로 변환 후 Qdrant에서 유사도 검색
        //    임계값(similarityThreshold) 미달 청크는 제외 → 관련 문서가 없으면 빈 리스트
        List<Document> relatedDocs = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(searchQuery)
                        .topK(topK)
                        .similarityThreshold(similarityThreshold)
                        .build()
        );

        // 4. 검색된 청크들을 하나의 문자열(context)로 합치기
        String context = relatedDocs.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n---\n"));

        // 출처 수집: 청크 메타데이터의 source(파일명)를 중복 제거해 유사도 순서대로
        // 프론트가 답변 하단에 "참고 문서"로 표시 → 답변 근거 추적 가능
        List<String> sources = relatedDocs.stream()
                .map(doc -> (String) doc.getMetadata().get("source"))
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        // 5. 프롬프트 조립: [시스템+context] + [히스토리] + [현재 질문]
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(SYSTEM_PROMPT.formatted(context)));
        messages.addAll(history);
        messages.add(new UserMessage(userMessage));

        // 히스토리에 현재 질문 저장 (응답은 doOnComplete에서 저장)
        sessionStore.addMessage(sessionId, new UserMessage(userMessage));

        // 6. Generation: 출처 이벤트를 먼저 보내고, LLM 스트리밍을 이어붙임
        //    - event: sources → 참고 문서 파일명 JSON 배열 (검색 결과 없으면 생략)
        //    - event 없음(message) → 답변 텍스트 청크
        Flux<ServerSentEvent<String>> sourceEvent = sources.isEmpty()
                ? Flux.empty()
                : Flux.just(ServerSentEvent.<String>builder(toJson(sources)).event("sources").build());

        StringBuilder fullResponse = new StringBuilder();

        Flux<ServerSentEvent<String>> contentStream = chatClient.prompt(new Prompt(messages))
                .stream()
                .content()
                .doOnNext(fullResponse::append)
                .doOnComplete(() -> sessionStore.addMessage(sessionId, new AssistantMessage(fullResponse.toString())))
                .map(chunk -> ServerSentEvent.builder(chunk).build());

        return Flux.concat(sourceEvent, contentStream);
    }

    private String toJson(List<String> sources) {
        try {
            return objectMapper.writeValueAsString(sources);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    /**
     * 후속 질문 대응을 위한 검색 쿼리 보정
     *
     * 짧은 질문(20자 이하)은 후속 질문일 가능성이 높음
     * → 이전 질문을 앞에 붙여 검색 정확도 향상
     *
     * ex) history: "HMAC이 뭐예요?" / userMessage: "검증은요?"
     *     → searchQuery: "HMAC이 뭐예요? 검증은요?"
     */
    private String buildSearchQuery(String userMessage, List<Message> history) {
        if (history.isEmpty() || userMessage.length() > 20) {
            return userMessage;
        }
        String lastUserMessage = history.stream()
                .filter(m -> m instanceof UserMessage)
                .reduce((first, second) -> second)
                .map(Message::getText)
                .orElse("");
        return lastUserMessage + " " + userMessage;
    }
}
