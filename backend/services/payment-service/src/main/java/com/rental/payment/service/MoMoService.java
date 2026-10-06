package com.rental.payment.service;

import com.rental.payment.dto.MoMoPaymentRequest;
import com.rental.payment.dto.MoMoPaymentResponse;

import java.util.Map;

public interface MoMoService {
    MoMoPaymentResponse createPaymentUrl(MoMoPaymentRequest request);
    boolean verifyPayment(Map<String, String> params);
}
