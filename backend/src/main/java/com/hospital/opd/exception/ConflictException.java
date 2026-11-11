package com.hospital.opd.exception;

import java.util.Collections;
import java.util.Map;

public class ConflictException extends RuntimeException {

    private final Map<String, String> errors;

    public ConflictException(String field, String message) {
        super(message);
        this.errors = Collections.singletonMap(field, message);
    }

    public ConflictException(String message) {
        super(message);
        this.errors = Collections.singletonMap("message", message);
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
