package com.rental.payment.controller;

import com.rental.payment.dto.CreatePaymentRequest;
import com.rental.payment.dto.PaymentResponse;
import com.rental.payment.entity.PaymentStatus;
import com.rental.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ResponseEntity<PaymentResponse> createPayment(@Valid @RequestBody CreatePaymentRequest request, @RequestHeader("X-User-Roles") String roles) {
        if(!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN,"Chủ trọ cần xác nhận giao dịch thủ công");
        return ResponseEntity.status(HttpStatus.CREATED).body(paymentService.createPayment(request));
    }

}
