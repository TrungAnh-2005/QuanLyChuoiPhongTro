package com.rental.contract.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;
@RestController @RequestMapping("/api/contracts") @RequiredArgsConstructor
public class ContractWorkflowController {
    private final JdbcTemplate jdbc;
    private final com.rental.contract.service.ContractService contracts;
    private final com.rental.contract.client.RoomClient rooms;
    @PostMapping("/requests/{id}/approve") @Transactional
    public Object approve(@PathVariable Long id,@RequestHeader("X-User-Roles") String roles) {
        manager(roles);
        Map<String,Object> q=jdbc.queryForMap("SELECT * FROM room_requests WHERE id=? FOR UPDATE",id);
        if ("APPROVED".equals(q.get("status"))) return Map.of("success",true,"data",id);
        Long roomId=((Number)q.get("target_room_id")).longValue();
        int months=q.get("duration_months")==null?12:((Number)q.get("duration_months")).intValue();
        if (months < 1 || months > 120) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Thời hạn không hợp lệ");
        String type=q.get("type").toString();
        if (type.equals("RENT") || type.equals("TRANSFER")) {
            var room=rooms.getRoomById(roomId).getData();
            if(type.equals("TRANSFER") && q.get("contract_id")!=null) contracts.terminateContract(((Number)q.get("contract_id")).longValue());
            contracts.createContract(com.rental.contract.dto.CreateContractRequest.builder().tenantId(((Number)q.get("tenant_id")).longValue()).roomId(roomId).startDate(java.time.LocalDate.now()).endDate(java.time.LocalDate.now().plusMonths(months)).rentalPrice(room.getBasePrice()).depositAmount(room.getBasePrice()).paymentCycle(1).build());
        } else if (type.equals("RENEW_CONTRACT")) {
            if(q.get("contract_id")==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Thiếu hợp đồng gia hạn");
            Long contractId=((Number)q.get("contract_id")).longValue();
            var current=contracts.getContractById(contractId);
            contracts.renewContract(contractId,com.rental.contract.dto.RenewContractRequest.builder().newEndDate(current.getEndDate().plusMonths(months)).build());
        }
        jdbc.update("UPDATE room_requests SET status='APPROVED',reviewed_at=CURRENT_TIMESTAMP WHERE id=?",id);
        return Map.of("success",true,"data",id);
    }
    private void manager(String roles) { if(!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) throw new ResponseStatusException(HttpStatus.FORBIDDEN); }
    @PostMapping("/settlements/{id}/complete") @Transactional
    public Object settle(@PathVariable Long id,@RequestBody Map<String,java.math.BigDecimal> body,@RequestHeader("X-User-Roles") String roles) {
        manager(roles);
        var settlement=jdbc.queryForMap("SELECT * FROM move_out_settlements WHERE id=? FOR UPDATE",id);
        if("COMPLETED".equals(settlement.get("refund_status"))) return Map.of("success",true,"data",id);
        java.math.BigDecimal deposit=new java.math.BigDecimal(settlement.get("original_deposit").toString());
        var damage=body.getOrDefault("damageFee",java.math.BigDecimal.ZERO);var utilities=body.getOrDefault("unpaidUtilitiesFee",java.math.BigDecimal.ZERO);
        if(damage.signum()<0 || utilities.signum()<0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        var refund=deposit.subtract(damage).subtract(utilities).max(java.math.BigDecimal.ZERO);
        contracts.terminateContract(((Number)settlement.get("contract_id")).longValue());
        jdbc.update("UPDATE move_out_settlements SET refund_amount=?,damage_fee=?,unpaid_utilities_fee=?,refund_status='COMPLETED',settled_at=CURRENT_TIMESTAMP WHERE id=?",refund,damage,utilities,id);
        return Map.of("success",true,"data",id);
    }
    @PostMapping("/requests/{id}/vote") public Object vote(@PathVariable Long id,@RequestBody Map<String,Boolean> body,@RequestHeader("X-User-Id") Long userId) {
        jdbc.update("INSERT INTO room_request_votes(request_id,user_id,approved) VALUES(?,?,?) ON DUPLICATE KEY UPDATE approved=VALUES(approved)",id,userId,Boolean.TRUE.equals(body.get("approved")));
        return Map.of("success",true,"data",id);
    }

    @PostMapping("/{id}/sign") @Transactional
    public Object sign(@PathVariable Long id) {
        if (jdbc.update("UPDATE contracts SET signed_electronically=true, signed_at=CURRENT_TIMESTAMP WHERE id=?",id)==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return Map.of("success",true,"data",id);
    }
    @PostMapping("/{id}/confirm-deposit") @Transactional
    public Object deposit(@PathVariable Long id,@RequestHeader("X-User-Roles") String roles) {
        if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Chủ trọ cần xác nhận đã nhận tiền cọc");
        if (jdbc.update("UPDATE contracts SET deposit_paid=true,deposit_paid_at=CURRENT_TIMESTAMP,status='ACTIVE' WHERE id=?",id)==0) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return Map.of("success",true,"data",id);
    }
    @PostMapping("/{id}/representative") public Object representative(@PathVariable Long id,@RequestBody Map<String,Long> body,@RequestHeader("X-User-Roles") String roles) {
        if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        jdbc.update("UPDATE contracts SET tenant_id=? WHERE id=?",body.get("tenantId"),id); return Map.of("success",true,"data",id);
    }
}
