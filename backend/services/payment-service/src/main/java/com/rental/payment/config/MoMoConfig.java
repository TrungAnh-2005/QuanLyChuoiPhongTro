package com.rental.payment.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@Getter
public class MoMoConfig {

    @Value("${rental.momo.partner-code:MOMO}")
    private String partnerCode;

    @Value("${rental.momo.access-key:F8BBA842ECF85}")
    private String accessKey;

    @Value("${rental.momo.secret-key:K951B6PE1waDMi640xX0qPDp5Aq6S0BP}")
    private String secretKey;

    @Value("${rental.momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String endpoint;

    @Value("${rental.momo.redirect-url:http://localhost:5173/payment/momo-return}")
    private String redirectUrl;

    @Value("${rental.momo.ipn-url:http://localhost:8087/api/payments/momo/ipn}")
    private String ipnUrl;

    public static String hmacSHA256(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException();
            }
            final Mac hmac256 = Mac.getInstance("HmacSHA256");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA256");
            hmac256.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac256.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }
}
