package com.rental.contract.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Confirmed money received by staff; retained after cancellation/expiry for reconciliation. */
@Entity
@Table(name = "deposit_receipts", uniqueConstraints = @UniqueConstraint(
        name = "uk_deposit_receipt_reference", columnNames = {"request_id", "receipt_reference"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositReceipt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @Column(name = "receipt_reference", nullable = false, length = 150)
    private String receiptReference;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private LocalDateTime confirmedAt;
}
