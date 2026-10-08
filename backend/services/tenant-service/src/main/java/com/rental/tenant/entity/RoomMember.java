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

    @Column(length = 50)
    @Builder.Default
    private String roleInRoom = "MEMBER"; // REPRESENTATIVE, MEMBER

    @Column(length = 50)
    @Builder.Default
    private String tempResidenceStatus = "CHUA_DANG_KY"; // CHUA_DANG_KY, CHO_DUYET, DA_DANG_KY

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
