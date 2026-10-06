package com.rental.notification.dto;

import com.rental.notification.entity.NotificationChannel;
import com.rental.notification.entity.NotificationType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {

    private Long recipientId;

    private String recipientEmail;

    private String recipientPhone;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    private NotificationType type;

    private NotificationChannel channel;
}
