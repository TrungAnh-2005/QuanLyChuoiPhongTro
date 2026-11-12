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
    private final com.rental.payment.service.VerifiedPaymentRecorder recorder;

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

        if (isSuccess) recorder.record(Long.valueOf(allParams.get("vnp_TxnRef").split("_")[0]),new java.math.BigDecimal(allParams.get("vnp_Amount")).divide(java.math.BigDecimal.valueOf(100)),"VNPAY-"+allParams.get("vnp_TransactionNo"),com.rental.payment.entity.PaymentMethod.VNPAY);
        return ResponseEntity.ok(Map.of(
                "success", isSuccess,
                "verifiedChecksum", valid,
                "responseCode", responseCode != null ? responseCode : "99",
                "message", isSuccess ? "Giao dịch VNPay thành công" : "Giao dịch không thành công hoặc chữ ký không hợp lệ"
        ));
    }
}
