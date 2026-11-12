package com.rental.notification;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
@Service @RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repository;
    @Transactional public Notification markRead(Long id, Long userId) {
        Notification notification = repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        notification.setRead(true);
        return repository.save(notification);
    }
    @Transactional public int markAllRead(Long userId) { return repository.markAllRead(userId); }
}
