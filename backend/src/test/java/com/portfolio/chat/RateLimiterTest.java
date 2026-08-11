package com.portfolio.chat;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assumptions.assumeThat;

/**
 * 로컬 Redis(docker-compose)를 대상으로 하는 Rate Limiter 검증.
 * Redis가 없으면 테스트를 건너뛴다.
 */
class RateLimiterTest {

    private static LettuceConnectionFactory connectionFactory;
    private static StringRedisTemplate redisTemplate;

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
    @DisplayName("한도까지는 허용하고 초과분은 거부한다")
    void allowsUpToLimitThenRejects() {
        RateLimiter rateLimiter = new RateLimiter(redisTemplate, 10);

        for (int i = 1; i <= 10; i++) {
            assertThat(rateLimiter.tryAcquire(sessionId)).as("request %d", i).isTrue();
        }
        assertThat(rateLimiter.tryAcquire(sessionId)).as("11th request").isFalse();
        assertThat(rateLimiter.tryAcquire(sessionId)).as("12th request").isFalse();
    }

    @Test
    @DisplayName("세션마다 한도를 따로 센다")
    void countsPerSession() {
        RateLimiter rateLimiter = new RateLimiter(redisTemplate, 2);
        String otherSession = sessionId + "-other";

        assertThat(rateLimiter.tryAcquire(sessionId)).isTrue();
        assertThat(rateLimiter.tryAcquire(sessionId)).isTrue();
        assertThat(rateLimiter.tryAcquire(sessionId)).isFalse();

        // 다른 세션은 영향받지 않아야 한다
        assertThat(rateLimiter.tryAcquire(otherSession)).isTrue();
    }

    @Test
    @DisplayName("같은 밀리초에 들어온 요청도 각각 집계된다")
    void countsRequestsWithinSameMillisecond() {
        RateLimiter rateLimiter = new RateLimiter(redisTemplate, 100);

        // member가 타임스탬프뿐이면 같은 밀리초 요청이 ZSET에서 덮어써져 집계가 누락된다
        for (int i = 0; i < 20; i++) {
            rateLimiter.tryAcquire(sessionId);
        }

        Long recorded = redisTemplate.opsForZSet().zCard("rate:chat:" + sessionId);
        assertThat(recorded).isEqualTo(20);
    }
}
