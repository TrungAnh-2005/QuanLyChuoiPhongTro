package com.rental.notification.service.impl;

import com.rental.notification.dto.CreateNotificationRequest;
import com.rental.notification.dto.NotificationResponse;
import com.rental.notification.entity.Notification;
import com.rental.notification.entity.NotificationChannel;
import com.rental.notification.entity.NotificationType;
import com.rental.notification.exception.ResourceNotFoundException;
import com.rental.notification.repository.NotificationRepository;
import com.rental.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public NotificationResponse createNotification(CreateNotificationRequest request) {
        Long targetId = request.getRecipientId();
        Notification notification = Notification.builder()
                .userId(targetId)
                .recipientId(targetId)
                .recipientEmail(request.getRecipientEmail())
                .recipientPhone(request.getRecipientPhone())
                .title(request.getTitle())
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : NotificationType.SYSTEM)
                .channel(request.getChannel() != null ? request.getChannel() : NotificationChannel.IN_APP)
                .isRead(false)
                .readStatus(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long recipientId, Boolean readStatus, NotificationType type) {
        List<Notification> list;

        if (recipientId != null && readStatus != null) {
            list = notificationRepository.findByRecipientIdAndReadStatusOrderByCreatedAtDesc(recipientId, readStatus);
        } else if (recipientId != null) {
            list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId);
        } else if (type != null) {
            list = notificationRepository.findByTypeOrderByCreatedAtDesc(type);
        } else {
            list = notificationRepository.findAllByOrderByCreatedAtDesc();
        }

        return list.stream()
                .filter(n -> readStatus == null || n.isReadStatus() == readStatus)
                .filter(n -> type == null || n.getType() == type)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getNotificationById(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));
        return mapToResponse(notification);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        notification.setRead(true);
        notification.setReadStatus(true);
        notification.setReadAt(LocalDateTime.now());
        Notification updated = notificationRepository.save(notification);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long recipientId) {
        List<Notification> unreadList = (recipientId != null)
                ? notificationRepository.findByRecipientIdAndReadStatusOrderByCreatedAtDesc(recipientId, false)
                : notificationRepository.findAll().stream().filter(n -> !n.isReadStatus()).collect(Collectors.toList());

        for (Notification notification : unreadList) {
            notification.setRead(true);
            notification.setReadStatus(true);
            notification.setReadAt(LocalDateTime.now());
        }
        notificationRepository.saveAll(unreadList);
    }

    @Override
    @Transactional
    public void saveSystemNotification(Long recipientId, String email, String phone, String title, String content, NotificationType type) {
        Notification notification = Notification.builder()
                .userId(recipientId)
                .recipientId(recipientId)
                .recipientEmail(email)
                .recipientPhone(phone)
                .title(title)
                .content(content)
                .type(type)
                .channel(NotificationChannel.IN_APP)
                .isRead(false)
                .readStatus(false)
                .build();

        notificationRepository.save(notification);
        log.info("System notification recorded: [type={}, recipientId={}, title={}]", type, recipientId, title);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipientId())
                .recipientEmail(notification.getRecipientEmail())
                .recipientPhone(notification.getRecipientPhone())
                .title(notification.getTitle())
                .content(notification.getContent())
                .type(notification.getType())
                .channel(notification.getChannel())
                .readStatus(notification.isReadStatus())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}
