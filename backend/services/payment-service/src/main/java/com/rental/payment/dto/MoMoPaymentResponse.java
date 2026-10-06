package com.rental.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoMoPaymentResponse {

    private String partnerCode;
    private String orderId;
    private String requestId;
    private Long amount;
    private String message;
    private Integer resultCode;
    private String payUrl;
    private String qrCodeUrl;
    private String deeplink;
}
