package com.rental.notification.service;

import com.rental.notification.dto.CreateNotificationRequest;
import com.rental.notification.dto.NotificationResponse;
import com.rental.notification.entity.NotificationType;

import java.util.List;

public interface NotificationService {
    NotificationResponse createNotification(CreateNotificationRequest request);
    List<NotificationResponse> getNotifications(Long recipientId, Boolean readStatus, NotificationType type);
    NotificationResponse getNotificationById(Long id);
    NotificationResponse markAsRead(Long id);
    void markAllAsRead(Long recipientId);
    void saveSystemNotification(Long recipientId, String email, String phone, String title, String content, NotificationType type);
}
