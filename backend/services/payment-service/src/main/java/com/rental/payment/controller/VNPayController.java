package com.rental.payment.controller;

import com.rental.payment.dto.VNPayPaymentRequest;
import com.rental.payment.dto.VNPayPaymentResponse;
import com.rental.payment.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
@RequiredArgsConstructor
public class VNPayController {

    private final VNPayService vnPayService;

    @PostMapping("/create-url")
    public ResponseEntity<VNPayPaymentResponse> createPaymentUrl(
            @Valid @RequestBody VNPayPaymentRequest request,
            HttpServletRequest servletRequest) {
        String clientIp = servletRequest.getRemoteAddr();
        return ResponseEntity.ok(vnPayService.createPaymentUrl(request, clientIp));
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestParam Map<String, String> allParams) {
        boolean valid = vnPayService.verifyPayment(allParams);
        String responseCode = allParams.get("vnp_ResponseCode");
        boolean isSuccess = valid && "00".equals(responseCode);

        return ResponseEntity.ok(Map.of(
                "success", isSuccess,
                "verifiedChecksum", valid,
                "responseCode", responseCode != null ? responseCode : "99",
                "message", isSuccess ? "Giao dịch VNPay thành công" : "Giao dịch không thành công hoặc chữ ký không hợp lệ"
        ));
    }
}
