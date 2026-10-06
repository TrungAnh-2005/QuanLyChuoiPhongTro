package com.rental.report.client;

import com.rental.report.client.dto.InvoiceClientDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "billing-service")
public interface BillingClient {

    @GetMapping("/api/invoices")
    List<InvoiceClientDto> getAllInvoices();
}
