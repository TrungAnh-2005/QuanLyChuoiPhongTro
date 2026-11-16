package com.rental.billing.service.impl;

import com.rental.billing.client.ContractClient;
import com.rental.billing.client.MeterClient;
import com.rental.billing.client.dto.ContractDto;
import com.rental.billing.client.dto.MeterReadingDto;
import com.rental.billing.dto.*;
import com.rental.billing.dto.event.InvoiceEventDTO;
import com.rental.billing.entity.Invoice;
import com.rental.billing.entity.InvoiceItem;
import com.rental.billing.entity.InvoiceStatus;
import com.rental.billing.exception.AppException;
import com.rental.billing.publisher.InvoiceEventPublisher;
import com.rental.billing.repository.InvoiceRepository;
import com.rental.billing.service.BillingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BillingServiceImpl implements BillingService {

    private final InvoiceRepository invoiceRepository;
    private final ContractClient contractClient;
    private final MeterClient meterClient;
    private final InvoiceEventPublisher eventPublisher;

    @Override
    @Transactional
    public InvoiceResponse generateMonthlyInvoice(GenerateMonthlyInvoiceRequest request) {
        ContractDto contract;
        try {
            ApiResponse<ContractDto> res = contractClient.getContractById(request.getContractId());
            if (res == null || res.getData() == null) {
                throw new AppException("Contract not found with id: " + request.getContractId(), HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND");
            }
            contract = res.getData();
        } catch (Exception e) {
            log.error("Failed to fetch contract info for id: {}", request.getContractId(), e);
            throw new AppException("Failed to fetch contract info: " + e.getMessage(), HttpStatus.BAD_REQUEST, "CONTRACT_FETCH_FAILED");
        }

        BigDecimal roomFee = contract.getRentalPrice();
        BigDecimal electricityFee = BigDecimal.ZERO;
        BigDecimal waterFee = BigDecimal.ZERO;

        try {
            ApiResponse<MeterReadingDto> elecRes = meterClient.getLatestReading(contract.getRoomId(), "ELECTRICITY");
            if (elecRes != null && elecRes.getData() != null && elecRes.getData().getFee() != null) {
                electricityFee = elecRes.getData().getFee();
            }
        } catch (Exception e) {
            log.warn("Could not retrieve latest electricity fee for room {}: {}", contract.getRoomId(), e.getMessage());
        }

        try {
            ApiResponse<MeterReadingDto> waterRes = meterClient.getLatestReading(contract.getRoomId(), "WATER");
            if (waterRes != null && waterRes.getData() != null && waterRes.getData().getFee() != null) {
                waterFee = waterRes.getData().getFee();
            }
        } catch (Exception e) {
            log.warn("Could not retrieve latest water fee for room {}: {}", contract.getRoomId(), e.getMessage());
        }

        BigDecimal internetFee = request.getInternetFee() != null ? request.getInternetFee() : BigDecimal.ZERO;
        BigDecimal serviceFee = request.getServiceFee() != null ? request.getServiceFee() : BigDecimal.ZERO;
        BigDecimal parkingFee = request.getParkingFee() != null ? request.getParkingFee() : BigDecimal.ZERO;
        BigDecimal otherFee = request.getOtherFee() != null ? request.getOtherFee() : BigDecimal.ZERO;
        BigDecimal discount = request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO;

        BigDecimal totalAmount = roomFee.add(electricityFee).add(waterFee)
                .add(internetFee).add(serviceFee).add(parkingFee).add(otherFee)
                .subtract(discount);

        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) {
            totalAmount = BigDecimal.ZERO;
        }

        String invoiceCode = String.format("INV-%d%02d-%s", request.getYear(), request.getMonth(),
                UUID.randomUUID().toString().substring(0, 6).toUpperCase());

        LocalDate dueDate = request.getDueDate() != null ? request.getDueDate() : LocalDate.of(request.getYear(), request.getMonth(), 15);

        Invoice invoice = Invoice.builder()
                .invoiceCode(invoiceCode)
                .contractId(contract.getId())
                .tenantId(contract.getTenantId())
                .roomId(contract.getRoomId())
                .month(request.getMonth())
                .year(request.getYear())
                .roomFee(roomFee)
                .electricityFee(electricityFee)
                .waterFee(waterFee)
                .internetFee(internetFee)
                .serviceFee(serviceFee)
                .parkingFee(parkingFee)
                .otherFee(otherFee)
                .discount(discount)
                .totalAmount(totalAmount)
                .status(InvoiceStatus.UNPAID)
                .dueDate(dueDate)
                .items(new ArrayList<>())
                .build();

        addInvoiceItem(invoice, "Tiền phòng", 1, roomFee);
        if (electricityFee.compareTo(BigDecimal.ZERO) > 0) {
            addInvoiceItem(invoice, "Tiền điện", 1, electricityFee);
        }
        if (waterFee.compareTo(BigDecimal.ZERO) > 0) {
            addInvoiceItem(invoice, "Tiền nước", 1, waterFee);
        }
        if (internetFee.compareTo(BigDecimal.ZERO) > 0) {
            addInvoiceItem(invoice, "Tiền Internet", 1, internetFee);
        }
        if (serviceFee.compareTo(BigDecimal.ZERO) > 0) {
            addInvoiceItem(invoice, "Phí dịch vụ", 1, serviceFee);
        }

        Invoice saved = invoiceRepository.save(invoice);

        InvoiceEventDTO event = InvoiceEventDTO.builder()
                .invoiceId(saved.getId())
                .invoiceCode(saved.getInvoiceCode())
                .contractId(saved.getContractId())
                .tenantId(saved.getTenantId())
                .roomId(saved.getRoomId())
                .month(saved.getMonth())
                .year(saved.getYear())
                .totalAmount(saved.getTotalAmount())
                .status(saved.getStatus().name())
                .build();
        eventPublisher.publishInvoiceCreated(event);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoices(InvoiceStatus status, Long tenantId, Integer month, Integer year) {
        return invoiceRepository.findByFilter(status, tenantId, month, year).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private void addInvoiceItem(Invoice invoice, String name, int quantity, BigDecimal unitPrice) {
        InvoiceItem item = InvoiceItem.builder()
                .invoice(invoice)
                .itemName(name)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .amount(unitPrice.multiply(BigDecimal.valueOf(quantity)))
                .build();
        invoice.getItems().add(item);
    }

    private InvoiceResponse mapToResponse(Invoice invoice) {
        List<InvoiceItemDto> items = invoice.getItems() != null
                ? invoice.getItems().stream().map(i -> InvoiceItemDto.builder()
                .id(i.getId())
                .itemName(i.getItemName())
                .quantity(i.getQuantity())
                .unitPrice(i.getUnitPrice())
                .amount(i.getAmount())
                .build()).collect(Collectors.toList())
                : List.of();

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .invoiceCode(invoice.getInvoiceCode())
                .contractId(invoice.getContractId())
                .tenantId(invoice.getTenantId())
                .roomId(invoice.getRoomId())
                .month(invoice.getMonth())
                .year(invoice.getYear())
                .roomFee(invoice.getRoomFee())
                .electricityFee(invoice.getElectricityFee())
                .waterFee(invoice.getWaterFee())
                .internetFee(invoice.getInternetFee())
                .serviceFee(invoice.getServiceFee())
                .parkingFee(invoice.getParkingFee())
                .otherFee(invoice.getOtherFee())
                .discount(invoice.getDiscount())
                .totalAmount(invoice.getTotalAmount())
                .status(invoice.getStatus())
                .dueDate(invoice.getDueDate())
                .items(items)
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }
}
