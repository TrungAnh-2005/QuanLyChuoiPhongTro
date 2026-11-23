package com.rental.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "landlord_profiles")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandlordProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, unique = true, length = 20)
    private String identityCard; // CCCD 12 so

    @Column(length = 100)
    private String fullName;

    private LocalDate birthDate;

    private LocalDate issueDate;

    @Column(length = 150)
    private String issuePlace;

    @Column(length = 255)
    private String permanentAddress;

    @Column(length = 500)
    private String cccdFrontUrl;

    @Column(length = 500)
    private String cccdBackUrl;

    @Column(length = 50)
    private String taxCode;

    @Column(length = 500)
    private String businessLicenseUrl;

    @Column(length = 20)
    @Builder.Default
    private String kycStatus = "PENDING"; // PENDING, VERIFIED, REJECTED

    @Column(length = 255)
    private String rejectionReason;

    private LocalDateTime verifiedAt;

    private Long verifiedBy;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
