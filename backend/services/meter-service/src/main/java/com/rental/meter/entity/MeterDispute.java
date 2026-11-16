package com.rental.meter.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "meter_disputes")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeterDispute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(name = "recorded_period", length = 20)
    private String recordedPeriod;

    @Column(name = "meter_type", length = 30)
    private String meterType;

    @Column(name = "system_reading", precision = 12, scale = 2)
    private BigDecimal systemReading;

    @Column(name = "reported_reading", precision = 12, scale = 2)
    private BigDecimal reportedReading;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

