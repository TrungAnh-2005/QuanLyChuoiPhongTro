package com.rental.billing.controller;

import com.rental.billing.entity.Invoice;
import com.rental.billing.entity.InvoiceStatus;
import com.rental.billing.entity.SaasInvoice;
import com.rental.billing.repository.InvoiceRepository;
import com.rental.billing.repository.SaasInvoiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceWorkflowController {

    private final InvoiceRepository invoiceRepository;
    private final SaasInvoiceRepository saasInvoiceRepository;

    @PutMapping("/{id}/meter-fees")
    @Transactional
    public Object meterFees(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> body,
            @RequestHeader("X-User-Roles") String roles
    ) {
        requireManager(roles);
        BigDecimal electricity = body.get("electricityFee");
        BigDecimal water = body.get("waterFee");

        if (electricity == null || water == null || electricity.signum() < 0 || water.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chi phí điện nước không hợp lệ");
        }

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hóa đơn"));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hóa đơn đã thanh toán, không thể điều chỉnh chỉ số");
        }

        BigDecimal oldElectricity = invoice.getElectricityFee() != null ? invoice.getElectricityFee() : BigDecimal.ZERO;
        BigDecimal oldWater = invoice.getWaterFee() != null ? invoice.getWaterFee() : BigDecimal.ZERO;

        BigDecimal updatedTotal = invoice.getTotalAmount()
                .subtract(oldElectricity)
                .subtract(oldWater)
                .add(electricity)
                .add(water);

        invoice.setElectricityFee(electricity);
        invoice.setWaterFee(water);
        invoice.setTotalAmount(updatedTotal);
        invoiceRepository.save(invoice);

        return Map.of("success", true, "data", id);
    }

    @PostMapping("/{id}/confirm-payment")
    @Transactional
    public Object confirmPayment(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hóa đơn"));

        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        return Map.of("success", true, "data", id);
    }

    @PostMapping("/saas/{id}/confirm-payment")
    @Transactional
    public Object saas(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("X-User-Roles") String roles
    ) {
        if (!roles.contains("ROLE_ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Quản trị viên cần đối soát thanh toán SaaS");
        }

        SaasInvoice saasInvoice = saasInvoiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hóa đơn SaaS"));

        saasInvoice.setStatus("PAID");
        saasInvoice.setPaidAt(LocalDateTime.now());
        saasInvoice.setPaymentMethod(body.getOrDefault("paymentMethod", "CASH"));
        saasInvoiceRepository.save(saasInvoice);

        return Map.of("success", true, "data", id);
    }

    @PostMapping("/{id}/maintenance-fee")
    @Transactional
    public Object fee(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> body,
            @RequestHeader("X-User-Roles") String roles
    ) {
        requireManager(roles);
        BigDecimal fee = body.get("amount");
        if (fee == null || fee.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền phí bảo trì không hợp lệ");
        }

        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hóa đơn"));

        if (invoice.getStatus() == InvoiceStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Hóa đơn đã thanh toán, không thể cộng thêm phí");
        }

        BigDecimal currentOtherFee = invoice.getOtherFee() != null ? invoice.getOtherFee() : BigDecimal.ZERO;
        invoice.setOtherFee(currentOtherFee.add(fee));
        invoice.setTotalAmount(invoice.getTotalAmount().add(fee));
        invoiceRepository.save(invoice);

        return Map.of("success", true, "data", id);
    }

    public record SaasInvoiceRequest(
            String code,
            Long landlordId,
            String packageName,
            String packageCode,
            String billingCycle,
            String period,
            BigDecimal amount,
            String status,
            LocalDate dueDate,
            LocalDateTime paidAt,
            String paymentMethod,
            String vatNumber,
            String landlordTaxCode
    ) {}

    @GetMapping("/saas")
    public Map<String, Object> listSaasInvoices() {
        return Map.of("success", true, "data", saasInvoiceRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }

    @PostMapping("/saas")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> createSaasInvoice(
            @RequestBody SaasInvoiceRequest req,
            @RequestHeader("X-User-Roles") String roles
    ) {
        requireManager(roles);
        if (req.code() == null || req.landlordId() == null || req.packageName() == null
                || req.packageCode() == null || req.billingCycle() == null || req.amount() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing required SaaS invoice fields");
        }
        SaasInvoice saved = saasInvoiceRepository.save(SaasInvoice.builder()
                .code(req.code())
                .landlordId(req.landlordId())
                .packageName(req.packageName())
                .packageCode(req.packageCode())
                .billingCycle(req.billingCycle())
                .period(req.period())
                .amount(req.amount())
                .status(req.status() != null ? req.status() : "UNPAID")
                .dueDate(req.dueDate())
                .paidAt(req.paidAt())
                .paymentMethod(req.paymentMethod())
                .vatNumber(req.vatNumber())
                .landlordTaxCode(req.landlordTaxCode())
                .build());
        return Map.of("success", true, "data", saved);
    }

    private void requireManager(String roles) {
        if (roles == null || (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
