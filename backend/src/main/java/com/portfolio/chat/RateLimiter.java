package com.portfolio.chat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;

/**
 * 세션당 채팅 요청 Rate Limiter (Redis Sliding Window Log)
 *
 * 공개 배포 시 한 세션이 채팅을 과도하게 보내면 OpenAI 비용이 급증할 수 있음.
 * → 최근 60초 동안의 요청 타임스탬프를 Sorted Set에 기록하고 개수로 판단.
 *
 * 고정 윈도우(INCR + EXPIRE) 대신 슬라이딩 윈도우를 쓴 이유:
 *   고정 윈도우는 경계에서 최대 2배 요청이 몰릴 수 있음
 *   (ex. 0:59에 10회 + 1:01에 10회 = 2초 동안 20회 허용)
 */
@Component
public class RateLimiter {

    private final StringRedisTemplate redisTemplate;
    private final int limitPerMinute;

    private static final String KEY_PREFIX = "rate:chat:";
    private static final long WINDOW_MILLIS = 60_000;

    public RateLimiter(StringRedisTemplate redisTemplate,
                       @Value("${portfolio.chat.rate-limit-per-minute:10}") int limitPerMinute) {
        this.redisTemplate = redisTemplate;
        this.limitPerMinute = limitPerMinute;
    }

    /**
     * 요청 허용 여부 판단. 허용 시 현재 요청을 윈도우에 기록.
     */
    public boolean tryAcquire(String sessionId) {
        String key = KEY_PREFIX + sessionId;
        long now = System.currentTimeMillis();

        // 1. 윈도우(60초) 밖으로 밀려난 과거 기록 제거
        redisTemplate.opsForZSet().removeRangeByScore(key, 0, now - WINDOW_MILLIS);

        // 2. 최근 60초 요청 수가 한도 이상이면 거부
        Long count = redisTemplate.opsForZSet().zCard(key);
        if (count != null && count >= limitPerMinute) {
            return false;
        }

        // 3. 현재 요청 기록 (member는 유니크해야 동시 요청이 덮어쓰이지 않음)
        redisTemplate.opsForZSet().add(key, now + ":" + UUID.randomUUID(), now);
        redisTemplate.expire(key, Duration.ofMinutes(2)); // 유휴 세션 키 자동 정리
        return true;
    }
}
