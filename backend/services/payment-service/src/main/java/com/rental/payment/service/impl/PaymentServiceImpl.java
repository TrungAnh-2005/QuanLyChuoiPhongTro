package com.rental.payment.service.impl;

import com.rental.payment.dto.CreatePaymentRequest;
import com.rental.payment.dto.PaymentResponse;
import com.rental.payment.dto.event.PaymentEventDTO;
import com.rental.payment.entity.Payment;
import com.rental.payment.entity.PaymentStatus;
import com.rental.payment.exception.ResourceNotFoundException;
import com.rental.payment.publisher.PaymentEventPublisher;
import com.rental.payment.repository.PaymentRepository;
import com.rental.payment.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventPublisher paymentEventPublisher;

    @Override
    @Transactional
    public PaymentResponse createPayment(CreatePaymentRequest request) {
        String transactionCode = request.getTransactionCode();
        if (transactionCode == null || transactionCode.isBlank()) {
            transactionCode = "TXN-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        Payment payment = Payment.builder()
                .paymentCode("PAY-" + System.currentTimeMillis())
                .invoiceId(request.getInvoiceId())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .status(PaymentStatus.COMPLETED)
                .transactionCode(transactionCode)
                .payerName(request.getPayerName())
                .payerPhone(request.getPayerPhone())
                .note(request.getNote())
                .paymentDate(LocalDateTime.now())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        PaymentEventDTO event = PaymentEventDTO.builder()
                .paymentId(savedPayment.getId())
                .invoiceId(savedPayment.getInvoiceId())
                .amount(savedPayment.getAmount())
                .paymentMethod(savedPayment.getPaymentMethod().name())
                .paymentDate(savedPayment.getPaymentDate())
                .payerName(savedPayment.getPayerName())
                .build();

        paymentEventPublisher.publishPaymentCompleted(event);

        return mapToResponse(savedPayment);
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .invoiceId(payment.getInvoiceId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .transactionCode(payment.getTransactionCode())
                .payerName(payment.getPayerName())
                .payerPhone(payment.getPayerPhone())
                .note(payment.getNote())
                .paymentDate(payment.getPaymentDate())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
