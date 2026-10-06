package com.rental.report.service;

import com.rental.report.dto.*;
import com.rental.report.dto.event.ContractEventDTO;
import com.rental.report.dto.event.PaymentEventDTO;

public interface ReportService {
    DashboardSummaryResponse getDashboardSummary();
    RevenueChartResponse getRevenueChart(Integer year);
    OccupancyChartResponse getOccupancyChart();
    DebtReportResponse getDebtReport();
    ExpiringContractResponse getExpiringContracts(Integer days);
    void processPaymentCompleted(PaymentEventDTO event);
    void processContractEvent(ContractEventDTO event);
}
