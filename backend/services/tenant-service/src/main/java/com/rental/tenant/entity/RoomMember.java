package com.rental.tenant.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "room_members")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long roomId;

    @Column(nullable = false)
    private Long tenantId;

    @Column(nullable = false)
    private Long contractId;

    @Column(length = 50)
    @Builder.Default
    private String roleInRoom = "MEMBER"; // REPRESENTATIVE, MEMBER

    private java.time.LocalDate joinDate;

    @Column(name = "temporary_residence_status", length = 50)
    @Builder.Default
    private String tempResidenceStatus = "REGISTERED"; // REGISTERED, NOT_REGISTERED

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, MOVED_OUT

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
