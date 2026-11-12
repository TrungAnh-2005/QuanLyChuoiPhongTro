package com.rental.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_requests")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(name = "contract_id")
    private Long contractId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "target_room_id", nullable = false)
    private Long targetRoomId;

    @Column(name = "current_room_id")
    private Long currentRoomId;

    @Column(name = "duration_months")
    private Integer durationMonths;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "forfeit_deposit", nullable = false)
    @Builder.Default
    private Boolean forfeitDeposit = false;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
