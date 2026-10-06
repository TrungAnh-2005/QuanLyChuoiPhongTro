package com.rental.notification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    private Long recipientId;

    @Column(length = 100)
    private String recipientEmail;

    @Column(length = 20)
    private String recipientPhone;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    @Column(nullable = false)
    private boolean isRead;

    @Column(nullable = false)
    private boolean readStatus;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime readAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.userId == null && this.recipientId != null) {
            this.userId = this.recipientId;
        } else if (this.recipientId == null && this.userId != null) {
            this.recipientId = this.userId;
        }
        if (this.channel == null) {
            this.channel = NotificationChannel.IN_APP;
        }
        if (this.type == null) {
            this.type = NotificationType.SYSTEM;
        }
    }
}
