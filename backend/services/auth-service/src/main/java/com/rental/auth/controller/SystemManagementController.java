package com.rental.auth.controller;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rental.auth.entity.SystemSetting;
import com.rental.auth.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class SystemManagementController {
    private final SystemSettingRepository settings;
    private final ObjectMapper json;
    private final JdbcTemplate jdbc;
    @GetMapping("/integrations") @PreAuthorize("hasRole('ADMIN')")
    public Object list() throws Exception {
        Map<String,Object> result=new LinkedHashMap<>();
        for (SystemSetting s:settings.findAll()) result.put(s.getKey(),json.readValue(s.getValue(),Map.class));
        return Map.of("success",true,"data",result);
    }
    @PutMapping("/integrations/{key}") @PreAuthorize("hasRole('ADMIN')")
    public Object save(@PathVariable String key,@RequestBody Map<String,Object> body) throws Exception {
        SystemSetting s=new SystemSetting(); s.setKey(key); s.setValue(json.writeValueAsString(body)); settings.save(s); return Map.of("success",true,"data",Map.of("key",key));
    }
    @GetMapping("/audit-logs") @PreAuthorize("hasRole('ADMIN')")
    public Object logs() { return Map.of("success",true,"data",jdbc.queryForList("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 500")); }
    @PostMapping("/audit-logs") public Object log(@RequestBody Map<String,Object> body, Authentication auth) {
        jdbc.update("INSERT INTO audit_logs(log_code,ip_address,user_role,username,action,target,details) VALUES(?,?,?,?,?,?,?)",UUID.randomUUID().toString(),"gateway",auth.getAuthorities().toString(),auth.getName(),body.getOrDefault("action","USER_ACTION"),body.getOrDefault("target",""),body.getOrDefault("details",""));
        return Map.of("success",true,"data",true);
    }
}
