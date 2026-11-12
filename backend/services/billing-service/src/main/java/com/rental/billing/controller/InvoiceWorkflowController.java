package com.rental.billing.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.util.*;
@RestController @RequestMapping("/api/invoices") @RequiredArgsConstructor
public class InvoiceWorkflowController {
    private final JdbcTemplate jdbc;
    @PutMapping("/{id}/meter-fees") @org.springframework.transaction.annotation.Transactional
    public Object meterFees(@PathVariable Long id,@RequestBody Map<String,BigDecimal> body,@RequestHeader("X-User-Roles") String roles) {
        requireManager(roles);var electricity=body.get("electricityFee");var water=body.get("waterFee");
        if(electricity==null||water==null||electricity.signum()<0||water.signum()<0)throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        if(jdbc.update("UPDATE invoices SET total_amount=total_amount-electricity_fee-water_fee+?+?,electricity_fee=?,water_fee=? WHERE id=? AND status<>'PAID'",electricity,water,electricity,water,id)==0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Hóa đơn đã thanh toán");
        return Map.of("success",true,"data",id);
    }

    private void requireManager(String roles) { if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) throw new ResponseStatusException(HttpStatus.FORBIDDEN); }
    @PostMapping("/saas/{id}/confirm-payment")
    public Object saas(@PathVariable Long id,@RequestBody Map<String,String> body,@RequestHeader("X-User-Roles") String roles) {
        if (!roles.contains("ROLE_ADMIN")) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Quản trị viên cần đối soát thanh toán SaaS");
        if(jdbc.update("UPDATE saas_invoices SET status='PAID',paid_at=CURRENT_TIMESTAMP,payment_method=? WHERE id=?",body.getOrDefault("paymentMethod","CASH"),id)==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return Map.of("success",true,"data",id);
    }
    @PostMapping("/{id}/maintenance-fee")
    public Object fee(@PathVariable Long id,@RequestBody Map<String,BigDecimal> body,@RequestHeader("X-User-Roles") String roles) {
        requireManager(roles); BigDecimal fee=body.get("amount"); if(fee==null || fee.signum()<0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        if(jdbc.update("UPDATE invoices SET other_fee=other_fee+?,total_amount=total_amount+? WHERE id=? AND status<>'PAID'",fee,fee,id)==0) throw new ResponseStatusException(HttpStatus.CONFLICT,"Hóa đơn đã thanh toán hoặc không tồn tại");
        return Map.of("success",true,"data",id);
    }
}
