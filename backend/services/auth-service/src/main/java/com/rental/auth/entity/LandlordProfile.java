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

    @Column(length = 255)
    private String cccdFrontUrl;

    @Column(length = 255)
    private String cccdBackUrl;

    @Column(length = 50)
    private String taxCode;

    @Column(length = 20)
    @Builder.Default
    private String kycStatus = "PENDING"; // PENDING, VERIFIED, REJECTED

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
