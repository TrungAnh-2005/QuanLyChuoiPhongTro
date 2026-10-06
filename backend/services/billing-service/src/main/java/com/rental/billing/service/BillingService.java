package com.rental.billing.service;

import com.rental.billing.dto.*;
import com.rental.billing.entity.InvoiceStatus;

import java.util.List;

public interface BillingService {
    InvoiceResponse generateMonthlyInvoice(GenerateMonthlyInvoiceRequest request);
    InvoiceResponse createInvoice(CreateInvoiceRequest request);
    List<InvoiceResponse> getInvoices(InvoiceStatus status, Long tenantId, Integer month, Integer year);
    InvoiceResponse getInvoiceById(Long id);
    InvoiceResponse updateInvoiceStatus(Long id, InvoiceStatus status);
}
