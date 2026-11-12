package com.rental.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "roommate_requests")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoommateRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long roomId;

    private Long requestedByTenantId;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 20)
    private String identityCard;

    @Column(nullable = false, length = 20)
    private String phone;

    private java.time.LocalDate birthDate;

    @Column(length = 10)
    private String gender;

    @Column(length = 255)
    private String hometown;

    @Column(length = 500)
    private String cccdFrontUrl;

    @Column(length = 500)
    private String cccdBackUrl;

    @Column(length = 255)
    private String note;

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(length = 255)
    private String rejectionReason;

    private LocalDateTime reviewedAt;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
