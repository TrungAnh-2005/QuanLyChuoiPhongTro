package com.rental.billing.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "invoices")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_code", nullable = false, unique = true, length = 50)
    private String invoiceCode;

    @Column(name = "contract_id", nullable = false)
    private Long contractId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(nullable = false)
    private Integer month;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "room_fee", nullable = false, precision = 15, scale = 2)
    private BigDecimal roomFee;

    @Column(name = "electricity_fee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal electricityFee = BigDecimal.ZERO;

    @Column(name = "water_fee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal waterFee = BigDecimal.ZERO;

    @Column(name = "internet_fee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal internetFee = BigDecimal.ZERO;

    @Column(name = "service_fee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal serviceFee = BigDecimal.ZERO;

    @Column(name = "parking_fee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal parkingFee = BigDecimal.ZERO;

    @Column(name = "other_fee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal otherFee = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.UNPAID;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
