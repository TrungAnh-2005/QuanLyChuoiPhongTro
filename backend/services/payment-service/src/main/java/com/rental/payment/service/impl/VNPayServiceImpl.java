package com.rental.payment.service.impl;

import com.rental.payment.config.VNPayConfig;
import com.rental.payment.dto.VNPayPaymentRequest;
import com.rental.payment.dto.VNPayPaymentResponse;
import com.rental.payment.service.VNPayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VNPayServiceImpl implements VNPayService {

    private final VNPayConfig vnPayConfig;

    @Override
    public VNPayPaymentResponse createPaymentUrl(VNPayPaymentRequest request, String clientIp) {
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_TxnRef = request.getInvoiceId() + "_" + System.currentTimeMillis();
        String vnp_IpAddr = (clientIp != null && !clientIp.isBlank()) ? clientIp : "127.0.0.1";
        String vnp_TmnCode = vnPayConfig.getVnpTmnCode();

        long amountInCents = request.getAmount().longValue() * 100L;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", String.valueOf(amountInCents));
        vnp_Params.put("vnp_CurrCode", "VND");

        if (request.getBankCode() != null && !request.getBankCode().isBlank()) {
            vnp_Params.put("vnp_BankCode", request.getBankCode());
        }

        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", request.getOrderInfo() != null && !request.getOrderInfo().isBlank()
                ? request.getOrderInfo()
                : "Thanh toan hoa don phong " + request.getInvoiceId());
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");

        String returnUrl = (request.getReturnUrl() != null && !request.getReturnUrl().isBlank())
                ? request.getReturnUrl()
                : vnPayConfig.getVnpReturnUrl();
        vnp_Params.put("vnp_ReturnUrl", returnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                // Build hash data
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                // Build query
                query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                query.append('=');
                query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

                if (itr.hasNext()) {
                    query.append('&');
                    hashData.append('&');
                }
            }
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = VNPayConfig.hmacSHA512(vnPayConfig.getVnpHashSecret(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
        String paymentUrl = vnPayConfig.getVnpPayUrl() + "?" + queryUrl;

        log.info("Generated VNPay sandbox URL for invoice {}: {}", request.getInvoiceId(), paymentUrl);

        return VNPayPaymentResponse.builder()
                .code("00")
                .message("success")
                .paymentUrl(paymentUrl)
                .txnRef(vnp_TxnRef)
                .build();
    }

    @Override
    public boolean verifyPayment(Map<String, String> params) {
        if (!params.containsKey("vnp_SecureHash")) {
            return false;
        }

        String vnp_SecureHash = params.get("vnp_SecureHash");
        Map<String, String> checkParams = new HashMap<>(params);
        checkParams.remove("vnp_SecureHash");
        checkParams.remove("vnp_SecureHashType");

        List<String> fieldNames = new ArrayList<>(checkParams.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = checkParams.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String calculatedHash = VNPayConfig.hmacSHA512(vnPayConfig.getVnpHashSecret(), hashData.toString());
        return calculatedHash.equalsIgnoreCase(vnp_SecureHash);
    }
}
