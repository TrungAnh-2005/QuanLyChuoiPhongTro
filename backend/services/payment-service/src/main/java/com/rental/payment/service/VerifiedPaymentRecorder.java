package com.rental.payment.service;
import com.rental.payment.dto.CreatePaymentRequest;
import com.rental.payment.entity.PaymentMethod;
import com.rental.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
@Service @RequiredArgsConstructor
public class VerifiedPaymentRecorder {
    private final PaymentRepository repository;
    private final PaymentService payments;
    public synchronized void record(Long invoiceId, BigDecimal amount, String transactionCode, PaymentMethod method) {
        if (repository.findByTransactionCode(transactionCode).isPresent()) return;
        payments.createPayment(CreatePaymentRequest.builder().invoiceId(invoiceId).amount(amount).transactionCode(transactionCode).paymentMethod(method).build());
    }
}
