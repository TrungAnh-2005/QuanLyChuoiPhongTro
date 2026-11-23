package com.rental.report.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "revenue_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "boarding_house_id")
    private Long boardingHouseId;

    @Column(nullable = false)
    private Long paymentId;

    @Column(nullable = false)
    private Long invoiceId;

    @Column(length = 50)
    private String category;

    @Column(name = "record_type", length = 20)
    @Builder.Default
    private String recordType = "INCOME";

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 30)
    private String paymentMethod;

    @Column(nullable = false)
    private LocalDateTime paymentDate;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer day;

    @Column(length = 255)
    private String description;

    @Column(name = "record_date")
    private java.time.LocalDate recordDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.paymentDate != null) {
            this.year = this.paymentDate.getYear();
            this.month = this.paymentDate.getMonthValue();
            this.day = this.paymentDate.getDayOfMonth();
            if (this.recordDate == null) {
                this.recordDate = this.paymentDate.toLocalDate();
            }
        }
    }
}
