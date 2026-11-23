package com.rental.notification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.Map;
@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor
public class NotificationController {
    private final NotificationRepository repository;
    private final NotificationService service;
    private Long user(String value) {
        try { long id = Long.parseLong(value); if (id > 0) return id; }
        catch (NumberFormatException ignored) { }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid user identity");
    }
    record CreateNotification(@jakarta.validation.constraints.NotNull Long userId, @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=200) String title, @jakarta.validation.constraints.NotBlank String content, @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=50) String type) {}
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> create(@jakarta.validation.Valid @RequestBody CreateNotification body,@RequestHeader("X-User-Roles") String roles) {
        if(!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        Notification notification=new Notification();notification.setUserId(body.userId());notification.setTitle(body.title());notification.setContent(body.content());notification.setType(body.type());
        return Map.of("success",true,"data",repository.save(notification));
    }
    @GetMapping public Map<String, Object> list(@RequestHeader("X-User-Id") String userId,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        if (page < 0 || size < 1 || size > 100) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid pagination");
        return Map.of("success", true, "data", repository.findByUserIdOrderByCreatedAtDesc(user(userId), PageRequest.of(page, size)));
    }
    @GetMapping("/unread-count") public Map<String, Object> unread(@RequestHeader("X-User-Id") String userId) {
        return Map.of("success", true, "data", repository.countByUserIdAndReadFalse(user(userId)));
    }
    @PatchMapping("/{id}/read") public Map<String, Object> read(@PathVariable Long id, @RequestHeader("X-User-Id") String userId) {
        return Map.of("success", true, "data", service.markRead(id, user(userId)));
    }
    @PatchMapping("/read-all") public Map<String, Object> readAll(@RequestHeader("X-User-Id") String userId) {
        return Map.of("success", true, "data", service.markAllRead(user(userId)));
    }
}
