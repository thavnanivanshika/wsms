package com.wsms.exception;

import org.springframework.http.HttpStatus;

/** Business-rule violation surfaced to the client with a specific HTTP status. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String field; // optional: routes the error to a specific form field

    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    public ApiException(HttpStatus status, String message, String field) {
        super(message);
        this.status = status;
        this.field = field;
    }

    public static ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, message);
    }

    public static ApiException conflict(String message) {
        return new ApiException(HttpStatus.CONFLICT, message);
    }

    /** Conflict tied to a specific request field — frontend shows it under that field. */
    public static ApiException conflictField(String field, String message) {
        return new ApiException(HttpStatus.CONFLICT, message, field);
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, message);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getField() {
        return field;
    }
}
