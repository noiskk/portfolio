package com.portfolio.chat.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatRequest {
    private String sessionId;
    private String message;
}
