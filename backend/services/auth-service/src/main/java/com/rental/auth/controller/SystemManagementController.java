package com.rental.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rental.auth.entity.AuditLog;
import com.rental.auth.entity.SystemSetting;
import com.rental.auth.repository.AuditLogRepository;
import com.rental.auth.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class SystemManagementController {

    private final SystemSettingRepository settings;
    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper json;

    @GetMapping("/integrations")
    @PreAuthorize("hasRole('ADMIN')")
    public Object list() throws Exception {
        Map<String, Object> result = new LinkedHashMap<>();
        for (SystemSetting s : settings.findAll()) {
            result.put(s.getKey(), json.readValue(s.getValue(), Map.class));
        }
        return Map.of("success", true, "data", result);
    }

    @PutMapping("/integrations/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public Object save(@PathVariable String key, @RequestBody Map<String, Object> body) throws Exception {
        SystemSetting s = new SystemSetting();
        s.setKey(key);
        s.setValue(json.writeValueAsString(body));
        settings.save(s);
        return Map.of("success", true, "data", Map.of("key", key));
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    public Object logs() {
        return Map.of("success", true, "data", auditLogRepository.findTop500ByOrderByIdDesc());
    }

    @PostMapping("/audit-logs")
    public Object log(@RequestBody Map<String, Object> body, Authentication auth) {
        AuditLog log = AuditLog.builder()
                .logCode(UUID.randomUUID().toString())
                .timestamp(LocalDateTime.now())
                .ipAddress("gateway")
                .userRole(auth != null && auth.getAuthorities() != null ? auth.getAuthorities().toString() : "ANONYMOUS")
                .username(auth != null ? auth.getName() : "anonymous")
                .action(body.getOrDefault("action", "USER_ACTION").toString())
                .target(body.getOrDefault("target", "").toString())
                .status("SUCCESS")
                .details(body.getOrDefault("details", "").toString())
                .build();
        auditLogRepository.save(log);
        return Map.of("success", true, "data", true);
    }
}
