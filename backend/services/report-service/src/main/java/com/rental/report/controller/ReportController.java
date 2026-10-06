package com.rental.report.controller;

import com.rental.report.dto.*;
import com.rental.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/dashboard-summary")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(reportService.getDashboardSummary());
    }

    @GetMapping("/revenue")
    public ResponseEntity<RevenueChartResponse> getRevenue(@RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(reportService.getRevenueChart(year));
    }

    @GetMapping("/revenue-chart")
    public ResponseEntity<RevenueChartResponse> getRevenueChart(@RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(reportService.getRevenueChart(year));
    }

    @GetMapping("/occupancy")
    public ResponseEntity<OccupancyChartResponse> getOccupancyChart() {
        return ResponseEntity.ok(reportService.getOccupancyChart());
    }

    @GetMapping("/debt")
    public ResponseEntity<DebtReportResponse> getDebtReport() {
        return ResponseEntity.ok(reportService.getDebtReport());
    }

    @GetMapping("/contracts-expiring")
    public ResponseEntity<ExpiringContractResponse> getExpiringContracts(@RequestParam(required = false) Integer days) {
        return ResponseEntity.ok(reportService.getExpiringContracts(days));
    }
}
