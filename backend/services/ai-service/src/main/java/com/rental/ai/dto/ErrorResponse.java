package com.rental.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    private Boolean success;
    private String message;
    private String errorCode;
    private LocalDateTime timestamp;
    private String requestId;
}
