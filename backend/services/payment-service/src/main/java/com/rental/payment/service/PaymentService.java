package com.rental.payment.service;

import com.rental.payment.dto.CreatePaymentRequest;
import com.rental.payment.dto.PaymentResponse;
import com.rental.payment.entity.PaymentStatus;

import java.util.List;

public interface PaymentService {
    PaymentResponse createPayment(CreatePaymentRequest request);
    List<PaymentResponse> getPayments(Long invoiceId, PaymentStatus status);
    PaymentResponse getPaymentById(Long id);
    List<PaymentResponse> getPaymentsByInvoiceId(Long invoiceId);
}
