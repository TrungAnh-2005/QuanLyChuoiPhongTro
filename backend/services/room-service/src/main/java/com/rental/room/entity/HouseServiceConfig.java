package com.rental.room.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "house_service_configs")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HouseServiceConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long boardingHouseId;

    @Column(nullable = false, length = 100)
    private String serviceName; // Dien, Nuoc, Wifi, Rac

    @Column(nullable = false, length = 50)
    private String calculationType; // METER, PER_CAPITA, PER_ROOM

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
