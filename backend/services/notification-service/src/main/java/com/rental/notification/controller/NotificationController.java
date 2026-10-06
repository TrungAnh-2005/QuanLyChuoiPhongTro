package com.rental.notification.controller;

import com.rental.notification.dto.CreateNotificationRequest;
import com.rental.notification.dto.NotificationResponse;
import com.rental.notification.entity.NotificationType;
import com.rental.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> createNotification(@Valid @RequestBody CreateNotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.createNotification(request));
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam(required = false) Long recipientId,
            @RequestParam(required = false) Boolean readStatus,
            @RequestParam(required = false) NotificationType type) {
        return ResponseEntity.ok(notificationService.getNotifications(recipientId, readStatus, type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getNotificationById(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getNotificationById(id));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam(required = false) Long recipientId) {
        notificationService.markAllAsRead(recipientId);
        return ResponseEntity.ok().build();
    }
}
