package com.rental.billing.service;

import com.rental.billing.dto.*;
import com.rental.billing.entity.InvoiceStatus;

import java.util.List;

public interface BillingService {
    InvoiceResponse generateMonthlyInvoice(GenerateMonthlyInvoiceRequest request);
    List<InvoiceResponse> getInvoices(InvoiceStatus status, Long tenantId, Integer month, Integer year);
}
