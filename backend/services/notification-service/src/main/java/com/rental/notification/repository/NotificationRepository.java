package com.rental.notification.repository;

import com.rental.notification.entity.Notification;
import com.rental.notification.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    List<Notification> findByRecipientIdAndReadStatusOrderByCreatedAtDesc(Long recipientId, boolean readStatus);
    List<Notification> findAllByOrderByCreatedAtDesc();
    List<Notification> findByTypeOrderByCreatedAtDesc(NotificationType type);
}
