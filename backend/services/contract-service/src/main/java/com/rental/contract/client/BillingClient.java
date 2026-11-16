package com.rental.contract.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.List;

@FeignClient(name = "billing-service")
public interface BillingClient {
    record Invoice(Long id, Long roomId, Long tenantId, String status) {}

    @GetMapping("/api/invoices")
    List<Invoice> getInvoices(@RequestParam("tenantId") Long tenantId);
}
