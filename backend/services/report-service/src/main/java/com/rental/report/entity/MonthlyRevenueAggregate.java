package com.rental.report.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "monthly_revenue_aggregates", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"year", "month"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyRevenueAggregate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal totalRevenue;

    @Column(nullable = false)
    private Long totalTransactions;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
