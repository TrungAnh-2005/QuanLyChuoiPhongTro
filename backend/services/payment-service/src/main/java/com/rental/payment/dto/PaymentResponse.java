package com.rental.payment.dto;

import com.rental.payment.entity.PaymentMethod;
import com.rental.payment.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {

    private Long id;
    private Long invoiceId;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String transactionCode;
    private String payerName;
    private String payerPhone;
    private String note;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;
}
