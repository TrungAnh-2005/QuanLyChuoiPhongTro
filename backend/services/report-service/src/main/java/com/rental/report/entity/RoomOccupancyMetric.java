package com.rental.report.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_occupancy_metrics")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomOccupancyMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long totalRooms;

    @Column(nullable = false)
    private Long occupiedRooms;

    @Column(nullable = false)
    private Long availableRooms;

    @Column(nullable = false)
    private Long maintenanceRooms;

    @Column(nullable = false)
    private Double occupancyRate;

    @Column(nullable = false)
    private LocalDate metricDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.metricDate == null) {
            this.metricDate = LocalDate.now();
        }
    }
}
