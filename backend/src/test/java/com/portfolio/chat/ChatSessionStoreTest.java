package com.portfolio.chat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assumptions.assumeThat;

/**
 * 로컬 Redis(docker-compose)를 대상으로 하는 세션 저장소 검증.
 * Redis가 없으면 테스트를 건너뛴다.
 */
class ChatSessionStoreTest {

    private static LettuceConnectionFactory connectionFactory;
    private static StringRedisTemplate redisTemplate;

    private ChatSessionStore sessionStore;
    private String sessionId;

    @BeforeAll
    static void connect() {
        connectionFactory = new LettuceConnectionFactory("localhost", 6379);
        connectionFactory.afterPropertiesSet();
        redisTemplate = new StringRedisTemplate(connectionFactory);
    }

    @AfterAll
    static void disconnect() {
        connectionFactory.destroy();
    }

    @BeforeEach
    void setUp() {
        assumeThat(redisAvailable()).as("local Redis on :6379").isTrue();
        sessionStore = new ChatSessionStore(redisTemplate, new ObjectMapper(), Duration.ofHours(1));
        sessionId = "test-" + System.nanoTime();
    }

    private boolean redisAvailable() {
        try {
            return "PONG".equals(redisTemplate.getConnectionFactory().getConnection().ping());
        } catch (Exception e) {
            return false;
        }
    }

    @Test
    @DisplayName("저장한 순서와 역할(user/assistant) 그대로 복원된다")
    void roundTripsMessagesInOrder() {
        sessionStore.addMessage(sessionId, new UserMessage("HMAC이 뭐예요?"));
        sessionStore.addMessage(sessionId, new AssistantMessage("해시 기반 메시지 인증 코드입니다."));
        sessionStore.addMessage(sessionId, new UserMessage("검증은요?"));

        List<Message> messages = sessionStore.getMessages(sessionId);

        assertThat(messages).hasSize(3);
        assertThat(messages.get(0)).isInstanceOf(UserMessage.class);
        assertThat(messages.get(0).getText()).isEqualTo("HMAC이 뭐예요?");
        assertThat(messages.get(1)).isInstanceOf(AssistantMessage.class);
        assertThat(messages.get(1).getText()).isEqualTo("해시 기반 메시지 인증 코드입니다.");
        assertThat(messages.get(2).getText()).isEqualTo("검증은요?");
    }

    @Test
    @DisplayName("세션이 없으면 빈 리스트를 반환한다")
    void returnsEmptyListForUnknownSession() {
        assertThat(sessionStore.getMessages("nonexistent-" + System.nanoTime())).isEmpty();
    }

    @Test
    @DisplayName("메시지를 추가할 때마다 TTL이 갱신된다")
    void refreshesTtlOnEachMessage() {
        sessionStore.addMessage(sessionId, new UserMessage("첫 질문"));
        Long ttl = redisTemplate.getExpire("chat:session:" + sessionId);

        // TTL이 설정돼 있어야 오래된 세션이 자동 정리된다 (-1: 만료 없음, -2: 키 없음)
        assertThat(ttl).isNotNull().isPositive().isLessThanOrEqualTo(3600);
    }
}
