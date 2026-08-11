package com.portfolio.chat;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * 세션별 대화 히스토리 Redis 저장소
 *
 * LLM은 무상태(stateless)라 이전 대화를 기억하지 못함.
 * 매 요청마다 히스토리를 함께 전송해야 대화 맥락이 유지됨.
 *
 * 저장 구조: chat:session:{sessionId} 키에 Redis List로 메시지 JSON 적재
 *   - Spring AI의 Message는 직렬화 대상이 아니므로 {role, content} 단순 레코드로 변환해 저장
 *   - TTL 1시간, 대화가 이어질 때마다 갱신 → 오래된 세션은 Redis가 자동 삭제
 *
 * ConcurrentHashMap 인메모리 방식에서 교체한 이유:
 *   - 서버 재시작 후에도 대화 이어가기 가능
 *   - 서버 다중 인스턴스 운영 시 세션 공유 가능
 *   - @Scheduled 수동 정리 대신 TTL로 만료 위임
 */
@Component
public class ChatSessionStore {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final Duration sessionTtl;

    private static final String KEY_PREFIX = "chat:session:";

    public ChatSessionStore(StringRedisTemplate redisTemplate,
                            ObjectMapper objectMapper,
                            @Value("${portfolio.chat.session-ttl:1h}") Duration sessionTtl) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
        this.sessionTtl = sessionTtl;
    }

    // Redis에 저장하는 최소 단위 - 역할과 내용만 있으면 Message 복원 가능
    record StoredMessage(String role, String content) {}

    /**
     * 세션의 메시지 목록 반환 (없으면 빈 리스트)
     */
    public List<Message> getMessages(String sessionId) {
        List<String> rawMessages = redisTemplate.opsForList().range(KEY_PREFIX + sessionId, 0, -1);
        List<Message> messages = new ArrayList<>();
        if (rawMessages == null) return messages;

        for (String json : rawMessages) {
            StoredMessage stored = fromJson(json);
            if (stored == null) continue;
            messages.add("user".equals(stored.role())
                    ? new UserMessage(stored.content())
                    : new AssistantMessage(stored.content()));
        }
        return messages;
    }

    /**
     * 세션에 메시지 추가 (질문 또는 응답) + TTL 갱신
     */
    public void addMessage(String sessionId, Message message) {
        String role = message instanceof UserMessage ? "user" : "assistant";
        String json = toJson(new StoredMessage(role, message.getText()));
        if (json == null) return;

        String key = KEY_PREFIX + sessionId;
        redisTemplate.opsForList().rightPush(key, json);
        redisTemplate.expire(key, sessionTtl);
    }

    private String toJson(StoredMessage message) {
        try {
            return objectMapper.writeValueAsString(message);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private StoredMessage fromJson(String json) {
        try {
            return objectMapper.readValue(json, StoredMessage.class);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
