package com.rental.auth.exception;

import com.rental.auth.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String REQUEST_ID_HEADER = "X-Request-Id";

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException ex, HttpServletRequest request) {
        String requestId = extractRequestId(request);
        log.warn("[APP_EXCEPTION] [{}] {}: {}", requestId, ex.getErrorCode(), ex.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .errorCode(ex.getErrorCode())
                .timestamp(Instant.now().toString())
                .requestId(requestId)
                .build();

        return new ResponseEntity<>(response, ex.getStatus());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String requestId = extractRequestId(request);
        String details = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        log.warn("[VALIDATION_ERROR] [{}]: {}", requestId, details);

        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .message(details)
                .errorCode("VALIDATION_ERROR")
                .timestamp(Instant.now().toString())
                .requestId(requestId)
                .build();

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(BadCredentialsException ex, HttpServletRequest request) {
        String requestId = extractRequestId(request);
        log.warn("[AUTH_FAILED] [{}]: Bad credentials", requestId);

        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .message("Invalid username or password")
                .errorCode("INVALID_CREDENTIALS")
                .timestamp(Instant.now().toString())
                .requestId(requestId)
                .build();

        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest request) {
        String requestId = extractRequestId(request);
        log.warn("[ACCESS_DENIED] [{}]: {}", requestId, ex.getMessage());

        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .message("You do not have permission to perform this action")
                .errorCode("ACCESS_DENIED")
                .timestamp(Instant.now().toString())
                .requestId(requestId)
                .build();

        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex, HttpServletRequest request) {
        String requestId = extractRequestId(request);
        log.error("[SYSTEM_ERROR] [{}]: ", requestId, ex);

        ErrorResponse response = ErrorResponse.builder()
                .success(false)
                .message("Internal server error")
                .errorCode("INTERNAL_SERVER_ERROR")
                .timestamp(Instant.now().toString())
                .requestId(requestId)
                .build();

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private String extractRequestId(HttpServletRequest request) {
        String reqId = request.getHeader(REQUEST_ID_HEADER);
        return reqId != null && !reqId.isBlank() ? reqId : "N/A";
    }
}
