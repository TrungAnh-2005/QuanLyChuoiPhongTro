package com.rental.contract.controller;

import com.rental.contract.client.RoomClient;
import com.rental.contract.dto.CreateContractRequest;
import com.rental.contract.dto.RenewContractRequest;
import com.rental.contract.entity.Contract;
import com.rental.contract.entity.ContractStatus;
import com.rental.contract.entity.MoveOutSettlement;
import com.rental.contract.entity.RoomRequest;
import com.rental.contract.entity.RoomRequestVote;
import com.rental.contract.repository.ContractRepository;
import com.rental.contract.repository.MoveOutSettlementRepository;
import com.rental.contract.repository.RoomRequestRepository;
import com.rental.contract.repository.RoomRequestVoteRepository;
import com.rental.contract.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractWorkflowController {

    private final ContractRepository contractRepository;
    private final MoveOutSettlementRepository moveOutSettlementRepository;
    private final RoomRequestRepository roomRequestRepository;
    private final RoomRequestVoteRepository roomRequestVoteRepository;
    private final ContractService contracts;
    private final RoomClient rooms;

    @PostMapping("/requests/{id}/approve")
    @Transactional
    public Object approve(
            @PathVariable Long id,
            @RequestHeader("X-User-Roles") String roles
    ) {
        manager(roles);

        RoomRequest request = roomRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu"));

        if ("APPROVED".equals(request.getStatus())) {
            return Map.of("success", true, "data", id);
        }

        Long roomId = request.getTargetRoomId();
        int months = request.getDurationMonths() == null ? 12 : request.getDurationMonths();
        if (months < 1 || months > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thời hạn thuê không hợp lệ");
        }

        String type = request.getType();
        if ("RENT".equals(type) || "TRANSFER".equals(type)) {
            var room = rooms.getRoomById(roomId).getData();
            if ("TRANSFER".equals(type) && request.getContractId() != null) {
                contracts.terminateContract(request.getContractId());
            }
            contracts.createContract(CreateContractRequest.builder()
                    .tenantId(request.getTenantId())
                    .roomId(roomId)
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusMonths(months))
                    .rentalPrice(room.getBasePrice())
                    .depositAmount(room.getBasePrice())
                    .paymentCycle(1)
                    .build());
        } else if ("RENEW_CONTRACT".equals(type)) {
            if (request.getContractId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu hợp đồng gia hạn");
            }
            Long contractId = request.getContractId();
            var current = contracts.getContractById(contractId);
            contracts.renewContract(contractId, RenewContractRequest.builder()
                    .newEndDate(current.getEndDate().plusMonths(months))
                    .build());
        }

        request.setStatus("APPROVED");
        request.setReviewedAt(LocalDateTime.now());
        roomRequestRepository.save(request);

        return Map.of("success", true, "data", id);
    }

    @PostMapping("/settlements/{id}/complete")
    @Transactional
    public Object settle(
            @PathVariable Long id,
            @RequestBody Map<String, BigDecimal> body,
            @RequestHeader("X-User-Roles") String roles
    ) {
        manager(roles);

        MoveOutSettlement settlement = moveOutSettlementRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hồ sơ thanh lý"));

        if ("COMPLETED".equals(settlement.getRefundStatus())) {
            return Map.of("success", true, "data", id);
        }

        BigDecimal deposit = settlement.getDepositAmount() != null ? settlement.getDepositAmount() : BigDecimal.ZERO;
        BigDecimal damage = body.getOrDefault("damageFee", BigDecimal.ZERO);
        BigDecimal utilities = body.getOrDefault("unpaidUtilitiesFee", BigDecimal.ZERO);

        if (damage.signum() < 0 || utilities.signum() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền phí không hợp lệ");
        }

        BigDecimal deduction = damage.add(utilities);
        BigDecimal refund = deposit.subtract(deduction).max(BigDecimal.ZERO);

        contracts.terminateContract(settlement.getContractId());

        settlement.setDamageFee(damage);
        settlement.setUnpaidUtilitiesFee(utilities);
        settlement.setDeductionAmount(deduction);
        settlement.setRefundAmount(refund);
        settlement.setRefundStatus("COMPLETED");
        settlement.setStatus("COMPLETED");
        settlement.setSettledAt(LocalDateTime.now());
        moveOutSettlementRepository.save(settlement);

        return Map.of("success", true, "data", id);
    }

    @PostMapping("/requests/{id}/vote")
    @Transactional
    public Object vote(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            @RequestHeader("X-User-Id") Long userId
    ) {
        Boolean approved = Boolean.TRUE.equals(body.get("approved"));
        RoomRequestVote vote = RoomRequestVote.builder()
                .requestId(id)
                .userId(userId)
                .approved(approved)
                .build();
        roomRequestVoteRepository.save(vote);

        return Map.of("success", true, "data", id);
    }

    @PostMapping("/{id}/sign")
    @Transactional
    public Object sign(@PathVariable Long id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"));

        contract.setSignedElectronically(true);
        contract.setSignedAt(LocalDateTime.now());
        contractRepository.save(contract);

        return Map.of("success", true, "data", id);
    }

    @PostMapping("/{id}/confirm-deposit")
    @Transactional
    public Object deposit(@PathVariable Long id, @RequestHeader("X-User-Roles") String roles) {
        if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Chủ trọ hoặc nhân viên cần xác nhận đã nhận tiền cọc");
        }

        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"));

        contract.setDepositPaid(true);
        contract.setDepositPaidAt(LocalDateTime.now());
        contract.setStatus(ContractStatus.ACTIVE);
        contractRepository.save(contract);

        return Map.of("success", true, "data", id);
    }

    @PostMapping("/{id}/representative")
    @Transactional
    public Object representative(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body,
            @RequestHeader("X-User-Roles") String roles
    ) {
        manager(roles);
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"));

        if (body.get("tenantId") == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu tenantId");
        }

        contract.setTenantId(body.get("tenantId"));
        contractRepository.save(contract);

        return Map.of("success", true, "data", id);
    }

    private void manager(String roles) {
        if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
