package com.rental.billing.controller;

import com.rental.billing.dto.*;
import com.rental.billing.entity.InvoiceStatus;
import com.rental.billing.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/generate-monthly")
    public ResponseEntity<InvoiceResponse> generateMonthlyInvoice(@Valid @RequestBody GenerateMonthlyInvoiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(billingService.generateMonthlyInvoice(request));
    }

    @GetMapping
    public ResponseEntity<List<InvoiceResponse>> getInvoices(
            @RequestParam(required = false) InvoiceStatus status,
            @RequestParam(required = false) Long tenantId,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(billingService.getInvoices(status, tenantId, month, year));
    }

}
