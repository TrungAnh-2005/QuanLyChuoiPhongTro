package com.rental.payment.controller;

import com.rental.payment.dto.MoMoPaymentRequest;
import com.rental.payment.dto.MoMoPaymentResponse;
import com.rental.payment.service.MoMoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/momo")
@RequiredArgsConstructor
public class MoMoController {

    private final MoMoService moMoService;

    @PostMapping("/create-url")
    public ResponseEntity<MoMoPaymentResponse> createPaymentUrl(@Valid @RequestBody MoMoPaymentRequest request) {
        return ResponseEntity.ok(moMoService.createPaymentUrl(request));
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestParam Map<String, String> allParams) {
        boolean valid = moMoService.verifyPayment(allParams);
        String resultCode = allParams.get("resultCode");
        boolean isSuccess = valid;

        return ResponseEntity.ok(Map.of(
                "success", isSuccess,
                "resultCode", resultCode != null ? resultCode : "99",
                "message", isSuccess ? "Giao dịch MoMo thành công" : "Giao dịch MoMo thất bại"
        ));
    }
}
