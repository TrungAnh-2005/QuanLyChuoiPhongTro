package com.rental.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "move_out_settlements")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoveOutSettlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long contractId;

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "tenant_id")
    private Long tenantId;

    @Column(nullable = false)
    private LocalDate moveOutDate;

    @Column(name="original_deposit", nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Column(name = "unpaid_utilities_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal unpaidUtilitiesFee = BigDecimal.ZERO;

    @Column(name = "damage_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal damageFee = BigDecimal.ZERO;

    @Column(name = "damage_description", length = 255)
    private String damageDescription;

    @Column(name = "deduction_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal deductionAmount = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal refundAmount;

    @Column(name = "bank_account", length = 50)
    private String bankAccount;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "account_holder", length = 100)
    private String accountHolder;

    @Column(name = "refund_status", length = 20)
    @Builder.Default
    private String refundStatus = "PENDING";

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    @Column(length = 255)
    private String reason;

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, COMPLETED

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
