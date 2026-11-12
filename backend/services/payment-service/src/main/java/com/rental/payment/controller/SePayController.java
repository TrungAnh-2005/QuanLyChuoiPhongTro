package com.rental.payment.controller;
import com.netflix.discovery.EurekaClient;
import com.rental.payment.service.VerifiedPaymentRecorder;
import com.rental.payment.entity.PaymentMethod;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
@RestController @RequestMapping("/api/payments/sepay") @RequiredArgsConstructor
public class SePayController {
    @Value("${SEPAY_API_KEY:}") private String apiKey;
    private final EurekaClient discovery;
    private final VerifiedPaymentRecorder recorder;
    private final RestClient http = RestClient.create();
    @GetMapping("/accounts") public Object accounts(@RequestHeader("X-User-Roles") String roles) {
        if(!roles.contains("ROLE_ADMIN")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        configured();return http.get().uri("https://my.sepay.vn/userapi/bankaccounts/list").header("Authorization","Bearer "+apiKey).retrieve().body(Map.class);
    }
    private void configured() { if(apiKey.isBlank()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Chưa cấu hình SEPAY_API_KEY ở backend"); }
    @GetMapping("/check") @SuppressWarnings("unchecked")
    public Object check(@RequestParam Long invoiceId) {
        configured();
        String billing = discovery.getNextServerFromEureka("BILLING-SERVICE",false).getHomePageUrl();
        Map<String,Object> response = http.get().uri(billing+"api/invoices/"+invoiceId).retrieve().body(Map.class);
        Map<String,Object> invoice = (Map<String,Object>)response.get("data");
        String code = invoice.get("invoiceCode").toString().replaceAll("[^A-Za-z0-9]","").toUpperCase(Locale.ROOT);
        BigDecimal amount = new BigDecimal(invoice.get("totalAmount").toString());
        Map<String,Object> result = http.get().uri("https://my.sepay.vn/userapi/transactions/list?limit=100").header("Authorization","Bearer "+apiKey).retrieve().body(Map.class);
        for (Map<String,Object> tx:(List<Map<String,Object>>)result.getOrDefault("transactions",List.of())) {
            String content=Objects.toString(tx.get("transaction_content"),"").replaceAll("[^A-Za-z0-9]","").toUpperCase(Locale.ROOT);
            BigDecimal paid=new BigDecimal(Objects.toString(tx.get("amount_in"),"0"));
            if(content.equals(code) && paid.compareTo(amount)==0) {
                recorder.record(invoiceId,amount,"SEPAY-"+tx.get("id"),PaymentMethod.BANK_TRANSFER);
                return Map.of("success",true,"transaction",tx);
            }
        }
        return Map.of("success",true,"matched",false);
    }
}
