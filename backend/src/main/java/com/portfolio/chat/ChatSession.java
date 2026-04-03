package com.portfolio.chat;

import org.springframework.ai.chat.messages.Message;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * 하나의 채팅 세션 (sessionId 단위)
 *
 * messages: LLM에 전달되는 대화 히스토리
 *   - UserMessage: 사용자 질문
 *   - AssistantMessage: LLM 응답
 *   순서 보장 중요 — LLM은 messages 순서대로 대화를 이해함
 *
 * lastAccessed: 세션 만료 판단용 타임스탬프
 */
public class ChatSession {

    private final List<Message> messages = new ArrayList<>();
    private Instant lastAccessed = Instant.now();

    public List<Message> getMessages() {
        return messages;
    }

    public Instant getLastAccessed() {
        return lastAccessed;
    }

    // 접근할 때마다 타임스탬프 갱신 → cleanup 대상에서 제외
    public void touch() {
        lastAccessed = Instant.now();
    }
}
