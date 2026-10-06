package com.rental.ai.exception;

import com.rental.ai.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Invalid input argument: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                ErrorResponse.builder()
                        .success(false)
                        .message(ex.getMessage())
                        .errorCode("INVALID_ARGUMENT")
                        .timestamp(LocalDateTime.now())
                        .requestId(UUID.randomUUID().toString())
                        .build()
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxSize(MaxUploadSizeExceededException ex) {
        log.warn("File size exceeded maximum limit: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(
                ErrorResponse.builder()
                        .success(false)
                        .message("Kích thước tệp tải lên vượt quá giới hạn tối đa cho phép (15MB).")
                        .errorCode("MAX_FILE_SIZE_EXCEEDED")
                        .timestamp(LocalDateTime.now())
                        .requestId(UUID.randomUUID().toString())
                        .build()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("Internal AI service error: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                ErrorResponse.builder()
                        .success(false)
                        .message("Lỗi xử lý AI OCR: " + ex.getMessage())
                        .errorCode("INTERNAL_AI_ERROR")
                        .timestamp(LocalDateTime.now())
                        .requestId(UUID.randomUUID().toString())
                        .build()
        );
    }
}
