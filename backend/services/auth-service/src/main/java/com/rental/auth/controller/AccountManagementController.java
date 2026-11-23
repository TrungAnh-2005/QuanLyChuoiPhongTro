package com.rental.auth.controller;
import com.rental.auth.entity.*;
import com.rental.auth.repository.*;
import com.rental.auth.dto.RegisterRequest;
import com.rental.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AccountManagementController {
    private final UserRepository users;
    private final LandlordProfileRepository profiles;
    private final PasswordEncoder passwords;
    private final AuthService auth;
    private Map<String,Object> ok(Object data) { return Map.of("success",true,"data",data); }
    private Map<String,Object> view(User u) {
        Map<String,Object> data = new LinkedHashMap<>();
        data.put("id",u.getId()); data.put("username",u.getUsername()); data.put("email",u.getEmail()); data.put("fullName",u.getFullName()); data.put("phone",u.getPhone()); data.put("status",u.getStatus()); data.put("packageCode",u.getPackageCode());
        return data;
    }
    @GetMapping("/accounts/me") public Object own(Authentication authentication) { return ok(List.of(view(users.findByUsername(authentication.getName()).orElseThrow()))); }
    @GetMapping("/accounts") @PreAuthorize("hasRole('ADMIN')")
    public Map<String,Object> list() { return ok(users.findAll().stream().filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_STAFF"))).map(this::view).toList()); }
    @PostMapping("/accounts") @PreAuthorize("hasRole('ADMIN')")
    public Object create(@Valid @RequestBody RegisterRequest request) { request.setRole("STAFF"); return ok(auth.register(request)); }
    @PatchMapping("/accounts/{id}") @PreAuthorize("hasRole('ADMIN')") @Transactional
    public Object update(@PathVariable Long id, @RequestBody Map<String,String> body) {
        User u = users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (body.containsKey("status")) u.setStatus(UserStatus.valueOf(body.get("status")));
        if (body.containsKey("packageCode")) u.setPackageCode(body.get("packageCode"));
        return ok(view(users.save(u)));
    }
    private Object reset(User u, String password) {
        if (password == null || password.length() < 8) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Mật khẩu mới cần ít nhất 8 ký tự");
        u.setPassword(passwords.encode(password)); users.save(u); return ok(Map.of("id",u.getId()));
    }
    @PostMapping("/accounts/{id}/reset-password") @PreAuthorize("hasRole('ADMIN')")
    public Object reset(@PathVariable Long id,@RequestBody Map<String,String> body) { return reset(users.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)),body.get("password")); }
    @PostMapping("/accounts/reset-by-email") @PreAuthorize("hasRole('ADMIN')")
    public Object resetByEmail(@RequestBody Map<String,String> body) { return reset(users.findByEmail(body.get("email")).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)),body.get("password")); }
    @GetMapping("/profiles") @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public Object profiles(Authentication authentication) {
        if (authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) return ok(profiles.findAll());
        User u = users.findByUsername(authentication.getName()).orElseThrow(); return ok(profiles.findByUserId(u.getId()).stream().toList());
    }
    @PatchMapping("/profiles/{id}") @PreAuthorize("hasRole('ADMIN')")
    public Object verify(@PathVariable Long id,@RequestBody Map<String,String> body) { LandlordProfile p = profiles.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)); p.setKycStatus(body.get("kycStatus")); return ok(profiles.save(p)); }
}
