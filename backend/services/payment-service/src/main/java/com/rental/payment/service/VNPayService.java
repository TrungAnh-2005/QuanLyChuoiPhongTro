package com.rental.payment.service;

import com.rental.payment.dto.VNPayPaymentRequest;
import com.rental.payment.dto.VNPayPaymentResponse;

import java.util.Map;

public interface VNPayService {
    VNPayPaymentResponse createPaymentUrl(VNPayPaymentRequest request, String clientIp);
    boolean verifyPayment(Map<String, String> params);
}
