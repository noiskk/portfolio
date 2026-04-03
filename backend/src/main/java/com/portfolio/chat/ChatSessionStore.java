package com.portfolio.chat;

import org.springframework.ai.chat.messages.Message;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 세션별 대화 히스토리 인메모리 저장소
 *
 * LLM은 무상태(stateless)라 이전 대화를 기억하지 못함.
 * 매 요청마다 히스토리를 함께 전송해야 대화 맥락이 유지됨.
 * → sessionId(UUID)를 key로 ConcurrentHashMap에 저장
 *
 * 한계: 서버 재시작 시 전체 히스토리 소멸
 * 개선 방향: Redis로 교체 시 재시작 후에도 유지 가능 (README 참고)
 */
@Component
public class ChatSessionStore {

    // 동시 요청에 안전한 Map (멀티스레드 환경 대응)
    private final ConcurrentHashMap<String, ChatSession> sessions = new ConcurrentHashMap<>();

    /**
     * 세션의 메시지 목록 반환
     * 세션이 없으면 새로 생성 (computeIfAbsent)
     */
    public List<Message> getMessages(String sessionId) {
        ChatSession session = sessions.computeIfAbsent(sessionId, k -> new ChatSession());
        session.touch(); // 마지막 접근 시간 갱신
        return session.getMessages();
    }

    /**
     * 세션에 메시지 추가 (질문 또는 응답)
     */
    public void addMessage(String sessionId, Message message) {
        ChatSession session = sessions.computeIfAbsent(sessionId, k -> new ChatSession());
        session.touch();
        session.getMessages().add(message);
    }

    /**
     * 오래된 세션 정리 - 메모리 누수 방지
     * 2시간 이상 미접근 세션 삭제, 1시간마다 실행
     */
    @Scheduled(fixedDelay = 3_600_000)
    public void cleanup() {
        Instant cutoff = Instant.now().minus(Duration.ofHours(2));
        sessions.entrySet().removeIf(e -> e.getValue().getLastAccessed().isBefore(cutoff));
    }
}
