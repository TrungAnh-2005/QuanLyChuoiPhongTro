package com.rental.meter.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "meter_readings")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeterReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meter_id", nullable = false)
    private Long meterId;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Enumerated(EnumType.STRING)
    @Column(name = "meter_type", nullable = false, length = 20)
    private MeterType meterType;

    @Column(name = "old_reading", nullable = false)
    private Double oldReading;

    @Column(name = "new_reading", nullable = false)
    private Double newReading;

    @Column(name = "reading_date", nullable = false)
    private LocalDate readingDate;

    @Column(name = "unit_price", nullable = false, precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "usage_amount", nullable = false)
    private Double usageAmount;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal fee;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "closed", nullable = false)
    private Boolean closed = false;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
