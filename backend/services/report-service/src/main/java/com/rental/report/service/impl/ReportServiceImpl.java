package com.rental.report.service.impl;

import com.rental.report.client.BillingClient;
import com.rental.report.client.ContractClient;
import com.rental.report.client.RoomClient;
import com.rental.report.client.dto.ContractClientDto;
import com.rental.report.client.dto.InvoiceClientDto;
import com.rental.report.client.dto.RoomClientDto;
import com.rental.report.dto.*;
import com.rental.report.dto.event.ContractEventDTO;
import com.rental.report.dto.event.PaymentEventDTO;
import com.rental.report.entity.MonthlyRevenueAggregate;
import com.rental.report.entity.MonthlyRevenueReport;
import com.rental.report.entity.RevenueRecord;
import com.rental.report.entity.RoomOccupancyMetric;
import com.rental.report.repository.MonthlyRevenueAggregateRepository;
import com.rental.report.repository.MonthlyRevenueReportRepository;
import com.rental.report.repository.RevenueRecordRepository;
import com.rental.report.repository.RoomOccupancyMetricRepository;
import com.rental.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final RevenueRecordRepository revenueRecordRepository;
    private final MonthlyRevenueAggregateRepository monthlyRevenueAggregateRepository;
    private final MonthlyRevenueReportRepository monthlyRevenueReportRepository;
    private final RoomOccupancyMetricRepository roomOccupancyMetricRepository;
    private final RoomClient roomClient;
    private final ContractClient contractClient;
    private final BillingClient billingClient;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        List<RoomClientDto> rooms = Collections.emptyList();
        try {
            rooms = roomClient.getAllRooms();
        } catch (Exception ex) {
            log.warn("Could not retrieve rooms from room-service: {}", ex.getMessage());
        }

        long totalRooms = rooms.size();
        long occupiedRooms = rooms.stream().filter(r -> "OCCUPIED".equalsIgnoreCase(r.getStatus())).count();
        long availableRooms = rooms.stream().filter(r -> "AVAILABLE".equalsIgnoreCase(r.getStatus())).count();
        double occupancyRate = totalRooms > 0 ? ((double) occupiedRooms / totalRooms) * 100 : 0.0;

        List<ContractClientDto> contracts = Collections.emptyList();
        try {
            contracts = contractClient.getAllContracts();
        } catch (Exception ex) {
            log.warn("Could not retrieve contracts from contract-service: {}", ex.getMessage());
        }

        long activeContracts = contracts.stream().filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus())).count();

        LocalDate now = LocalDate.now();
        int currentYear = now.getYear();
        int currentMonth = now.getMonthValue();

        int previousYear = (currentMonth == 1) ? currentYear - 1 : currentYear;
        int previousMonth = (currentMonth == 1) ? 12 : currentMonth - 1;

        BigDecimal currentMonthRevenue = monthlyRevenueAggregateRepository
                .findByYearAndMonth(currentYear, currentMonth)
                .map(MonthlyRevenueAggregate::getTotalRevenue)
                .orElse(BigDecimal.ZERO);

        BigDecimal previousMonthRevenue = monthlyRevenueAggregateRepository
                .findByYearAndMonth(previousYear, previousMonth)
                .map(MonthlyRevenueAggregate::getTotalRevenue)
                .orElse(BigDecimal.ZERO);

        double growth = 0.0;
        if (previousMonthRevenue.compareTo(BigDecimal.ZERO) > 0) {
            growth = currentMonthRevenue.subtract(previousMonthRevenue)
                    .divide(previousMonthRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        return DashboardSummaryResponse.builder()
                .totalRooms(totalRooms)
                .occupiedRooms(occupiedRooms)
                .availableRooms(availableRooms)
                .occupancyRate(Math.round(occupancyRate * 10.0) / 10.0)
                .currentMonthRevenue(currentMonthRevenue)
                .previousMonthRevenue(previousMonthRevenue)
                .revenueGrowthPercentage(Math.round(growth * 10.0) / 10.0)
                .activeContracts(activeContracts)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RevenueChartResponse getRevenueChart(Integer year) {
        int targetYear = (year != null && year > 0) ? year : LocalDate.now().getYear();

        List<MonthlyRevenueAggregate> aggregates = monthlyRevenueAggregateRepository.findByYearOrderByMonthAsc(targetYear);
        Map<Integer, MonthlyRevenueAggregate> map = aggregates.stream()
                .collect(Collectors.toMap(MonthlyRevenueAggregate::getMonth, a -> a));

        List<MonthlyRevenueItem> monthlyData = new ArrayList<>();
        BigDecimal totalAnnual = BigDecimal.ZERO;

        for (int m = 1; m <= 12; m++) {
            MonthlyRevenueAggregate agg = map.get(m);
            BigDecimal rev = agg != null ? agg.getTotalRevenue() : BigDecimal.ZERO;
            Long txs = agg != null ? agg.getTotalTransactions() : 0L;
            totalAnnual = totalAnnual.add(rev);

            monthlyData.add(MonthlyRevenueItem.builder()
                    .month(m)
                    .monthLabel("T" + m)
                    .revenue(rev)
                    .transactions(txs)
                    .build());
        }

        return RevenueChartResponse.builder()
                .year(targetYear)
                .totalAnnualRevenue(totalAnnual)
                .monthlyData(monthlyData)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public OccupancyChartResponse getOccupancyChart() {
        List<RoomClientDto> rooms = Collections.emptyList();
        try {
            rooms = roomClient.getAllRooms();
        } catch (Exception ex) {
            log.warn("Could not retrieve rooms: {}", ex.getMessage());
        }

        long totalRooms = rooms.size();
        long occupiedRooms = rooms.stream().filter(r -> "OCCUPIED".equalsIgnoreCase(r.getStatus())).count();
        long availableRooms = rooms.stream().filter(r -> "AVAILABLE".equalsIgnoreCase(r.getStatus())).count();
        long maintenanceRooms = rooms.stream().filter(r -> "MAINTENANCE".equalsIgnoreCase(r.getStatus())).count();
        double occupancyRate = totalRooms > 0 ? ((double) occupiedRooms / totalRooms) * 100 : 0.0;

        return OccupancyChartResponse.builder()
                .totalRooms(totalRooms)
                .occupiedRooms(occupiedRooms)
                .availableRooms(availableRooms)
                .maintenanceRooms(maintenanceRooms)
                .occupancyRate(Math.round(occupancyRate * 10.0) / 10.0)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DebtReportResponse getDebtReport() {
        List<InvoiceClientDto> invoices = Collections.emptyList();
        try {
            invoices = billingClient.getAllInvoices();
        } catch (Exception ex) {
            log.warn("Could not retrieve invoices from billing-service: {}", ex.getMessage());
        }

        LocalDate today = LocalDate.now();
        List<DebtReportResponse.DebtReportItem> debtItems = new ArrayList<>();
        BigDecimal totalDebt = BigDecimal.ZERO;

        for (InvoiceClientDto inv : invoices) {
            if ("UNPAID".equalsIgnoreCase(inv.getStatus()) || "PARTIAL".equalsIgnoreCase(inv.getStatus()) || "OVERDUE".equalsIgnoreCase(inv.getStatus())) {
                BigDecimal amount = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
                totalDebt = totalDebt.add(amount);

                long overdueDays = 0;
                if (inv.getDueDate() != null && today.isAfter(inv.getDueDate())) {
                    overdueDays = ChronoUnit.DAYS.between(inv.getDueDate(), today);
                }

                debtItems.add(DebtReportResponse.DebtReportItem.builder()
                        .invoiceId(inv.getId())
                        .invoiceNumber(inv.getInvoiceNumber())
                        .tenantId(inv.getTenantId())
                        .roomId(inv.getRoomId())
                        .amount(amount)
                        .dueDate(inv.getDueDate())
                        .overdueDays(overdueDays)
                        .build());
            }
        }

        return DebtReportResponse.builder()
                .totalDebt(totalDebt)
                .totalUnpaidInvoices(debtItems.size())
                .items(debtItems)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ExpiringContractResponse getExpiringContracts(Integer days) {
        int windowDays = (days != null && days > 0) ? days : 30;

        List<ContractClientDto> contracts = Collections.emptyList();
        try {
            contracts = contractClient.getAllContracts();
        } catch (Exception ex) {
            log.warn("Could not retrieve contracts from contract-service: {}", ex.getMessage());
        }

        LocalDate today = LocalDate.now();
        LocalDate maxDate = today.plusDays(windowDays);

        List<ExpiringContractResponse.ExpiringContractItem> items = new ArrayList<>();

        for (ContractClientDto contract : contracts) {
            if ("ACTIVE".equalsIgnoreCase(contract.getStatus()) && contract.getEndDate() != null) {
                if (!contract.getEndDate().isBefore(today) && !contract.getEndDate().isAfter(maxDate)) {
                    long remainingDays = ChronoUnit.DAYS.between(today, contract.getEndDate());
                    items.add(ExpiringContractResponse.ExpiringContractItem.builder()
                            .contractId(contract.getId())
                            .contractNumber(contract.getContractNumber())
                            .roomId(contract.getRoomId())
                            .tenantId(contract.getTenantId())
                            .endDate(contract.getEndDate())
                            .remainingDays(remainingDays)
                            .build());
                }
            }
        }

        return ExpiringContractResponse.builder()
                .totalExpiring(items.size())
                .items(items)
                .build();
    }

    @Override
    @Transactional
    public void processPaymentCompleted(PaymentEventDTO event) {
        LocalDateTime date = event.getPaymentDate() != null ? event.getPaymentDate() : LocalDateTime.now();

        RevenueRecord record = RevenueRecord.builder()
                .paymentId(event.getPaymentId())
                .invoiceId(event.getInvoiceId())
                .amount(event.getAmount())
                .paymentMethod(event.getPaymentMethod())
                .paymentDate(date)
                .year(date.getYear())
                .month(date.getMonthValue())
                .day(date.getDayOfMonth())
                .build();

        revenueRecordRepository.save(record);

        int year = date.getYear();
        int month = date.getMonthValue();

        MonthlyRevenueAggregate aggregate = monthlyRevenueAggregateRepository.findByYearAndMonth(year, month)
                .orElse(MonthlyRevenueAggregate.builder()
                        .year(year)
                        .month(month)
                        .totalRevenue(BigDecimal.ZERO)
                        .totalTransactions(0L)
                        .updatedAt(LocalDateTime.now())
                        .build());

        aggregate.setTotalRevenue(aggregate.getTotalRevenue().add(event.getAmount()));
        aggregate.setTotalTransactions(aggregate.getTotalTransactions() + 1);
        aggregate.setUpdatedAt(LocalDateTime.now());

        monthlyRevenueAggregateRepository.save(aggregate);

        MonthlyRevenueReport report = monthlyRevenueReportRepository.findByYearAndMonth(year, month)
                .orElse(MonthlyRevenueReport.builder()
                        .year(year)
                        .month(month)
                        .totalRevenue(BigDecimal.ZERO)
                        .totalTransactions(0L)
                        .updatedAt(LocalDateTime.now())
                        .build());

        report.setTotalRevenue(report.getTotalRevenue().add(event.getAmount()));
        report.setTotalTransactions(report.getTotalTransactions() + 1);
        report.setUpdatedAt(LocalDateTime.now());

        monthlyRevenueReportRepository.save(report);

        log.info("Aggregated monthly revenue report for year: {}, month: {}, new total: {}", year, month, aggregate.getTotalRevenue());
    }

    @Override
    @Transactional
    public void processContractEvent(ContractEventDTO event) {
        try {
            List<RoomClientDto> rooms = roomClient.getAllRooms();
            long totalRooms = rooms.size();
            long occupiedRooms = rooms.stream().filter(r -> "OCCUPIED".equalsIgnoreCase(r.getStatus())).count();
            long availableRooms = rooms.stream().filter(r -> "AVAILABLE".equalsIgnoreCase(r.getStatus())).count();
            long maintenanceRooms = rooms.stream().filter(r -> "MAINTENANCE".equalsIgnoreCase(r.getStatus())).count();
            double occupancyRate = totalRooms > 0 ? ((double) occupiedRooms / totalRooms) * 100 : 0.0;

            LocalDate today = LocalDate.now();
            RoomOccupancyMetric metric = roomOccupancyMetricRepository.findByMetricDate(today)
                    .orElse(RoomOccupancyMetric.builder()
                            .metricDate(today)
                            .build());

            metric.setTotalRooms(totalRooms);
            metric.setOccupiedRooms(occupiedRooms);
            metric.setAvailableRooms(availableRooms);
            metric.setMaintenanceRooms(maintenanceRooms);
            metric.setOccupancyRate(Math.round(occupancyRate * 10.0) / 10.0);

            roomOccupancyMetricRepository.save(metric);
        } catch (Exception ex) {
            log.warn("Could not record room occupancy metric: {}", ex.getMessage());
        }
    }
}
