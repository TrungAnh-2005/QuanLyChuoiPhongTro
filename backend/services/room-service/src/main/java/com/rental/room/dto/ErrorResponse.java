package com.rental.room.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {

    @Builder.Default
    private boolean success = false;

    private String message;

    private String errorCode;

    @Builder.Default
    private String timestamp = Instant.now().toString();

    private String requestId;
}
