package com.portfolio.chat;

import com.portfolio.chat.dto.ChatRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final RateLimiter rateLimiter;

    @PostMapping(produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<Flux<ServerSentEvent<String>>> chat(@RequestBody ChatRequest request) {
        // OpenAI 비용 보호: 세션당 분당 요청 한도 초과 시 429 → 프론트가 안내 메시지 표시
        if (!rateLimiter.tryAcquire(request.getSessionId())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        return ResponseEntity.ok(chatService.chat(request.getSessionId(), request.getMessage()));
    }
}
