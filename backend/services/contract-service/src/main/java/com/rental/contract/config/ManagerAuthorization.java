package com.rental.contract.config;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Arrays;

public final class ManagerAuthorization {
    private ManagerAuthorization() {}

    public static void requireManager(String roles) {
        boolean allowed = roles != null && Arrays.stream(roles.split("[\\s,\\[\\]\\\"']+"))
                .anyMatch(role -> "ROLE_ADMIN".equals(role) || "ROLE_STAFF".equals(role));
        if (!allowed) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Staff or admin confirmation is required");
    }
}
