package com.rental.notification.dto;

import com.rental.notification.entity.NotificationChannel;
import com.rental.notification.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private Long recipientId;
    private String recipientEmail;
    private String recipientPhone;
    private String title;
    private String content;
    private NotificationType type;
    private NotificationChannel channel;
    private boolean readStatus;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
}
