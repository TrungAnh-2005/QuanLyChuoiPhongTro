package com.rental.notification;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
@Entity @Table(name = "notifications") @Getter @Setter
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long userId;
    @Column(nullable = false, length = 200) private String title;
    @Column(nullable = false, columnDefinition = "TEXT") private String content;
    @Column(nullable = false, length = 50) private String type;
    @Column(nullable = false, length = 20) private String channel = "IN_APP";
    @Column(name = "is_read", nullable = false) private boolean read;
    @Column(nullable = false) private LocalDateTime sentAt;
    @Column(nullable = false) private LocalDateTime createdAt;
    @PrePersist void timestamps() { createdAt = LocalDateTime.now(); sentAt = createdAt; }
}
