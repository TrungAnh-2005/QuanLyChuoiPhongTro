package com.rental.contract.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public AppException(String message, HttpStatus status, String errorCode) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public AppException(String message, HttpStatus status) {
        this(message, status, "CONTRACT_SERVICE_ERROR");
    }

    public AppException(String message) {
        this(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
    }
}
