package com.portfolio.chat;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * RAG Retrieval + Generation Phase
 *
 * 질문 1개 처리 흐름:
 *   1. 세션에서 대화 히스토리 로드
 *   2. 검색 쿼리 보정 (후속 질문 대응)
 *   3. Qdrant 유사도 검색 → 관련 청크 Top-4 추출
 *   4. 프롬프트 조립: 시스템 + context + 히스토리 + 질문
 *   5. LLM 호출 → SSE 스트리밍 응답
 *   6. 히스토리 저장 (질문 + 응답)
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final ChatSessionStore sessionStore;

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

    public Flux<String> chat(String sessionId, String userMessage) {

        // 1. 세션별 대화 히스토리 로드
        //    없으면 빈 리스트 반환 (ChatSessionStore.computeIfAbsent)
        List<Message> history = sessionStore.getMessages(sessionId);

        // 2. 검색 쿼리 보정
        //    "그럼 검증은요?" 같은 짧은 후속 질문은 단독으로 검색하면 관련 문서를 못 찾을 수 있음
        //    → 이전 질문을 앞에 붙여서 의미 있는 쿼리로 만듦
        String searchQuery = buildSearchQuery(userMessage, history);

        // 3. Retrieval: 질문을 벡터로 변환 후 Qdrant에서 유사도 상위 4개 청크 검색
        //    내부 동작: searchQuery → OpenAI Embedding API → 1536차원 벡터
        //              → Qdrant 코사인 유사도 계산 → Top-4 청크 반환
        List<Document> relatedDocs = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(searchQuery)
                        .topK(4)
                        .build()
        );

        // 4. 검색된 청크들을 하나의 문자열(context)로 합치기
        //    이 context가 LLM이 답변 생성 시 참조하는 실제 정보
        String context = relatedDocs.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n---\n"));

        // 5. 프롬프트 조립: [시스템+context] + [히스토리] + [현재 질문]
        //    히스토리를 함께 전송하므로 LLM이 대화 맥락을 유지할 수 있음
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(SYSTEM_PROMPT.formatted(context)));
        messages.addAll(history);
        messages.add(new UserMessage(userMessage));

        // 히스토리에 현재 질문 저장 (응답은 doOnComplete에서 저장)
        sessionStore.addMessage(sessionId, new UserMessage(userMessage));

        // 6. Generation: LLM 호출 + SSE 스트리밍
        //    doOnNext: 토큰이 스트리밍될 때마다 fullResponse에 누적
        //    doOnComplete: 응답 완료 후 전체 텍스트를 히스토리에 저장
        StringBuilder fullResponse = new StringBuilder();

        return chatClient.prompt(new Prompt(messages))
                .stream()
                .content()
                .doOnNext(fullResponse::append)
                .doOnComplete(() -> sessionStore.addMessage(sessionId, new AssistantMessage(fullResponse.toString())));
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
