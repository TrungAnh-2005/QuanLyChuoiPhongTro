package com.rental.contract.controller;

import com.rental.contract.client.RoomClient;
import com.rental.contract.client.TenantClient;
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
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractWorkflowController {

    private final ContractRepository contractRepository;
    private final MoveOutSettlementRepository moveOutSettlementRepository;
    private final RoomRequestRepository roomRequestRepository;
    private final RoomRequestVoteRepository roomRequestVoteRepository;
    private final ContractService contracts;
    private final RoomClient rooms;
    private final TenantClient tenants;

    @PostMapping("/requests/{id}/approve")
    @Transactional
    public Object approve(
            @PathVariable Long id,
            @RequestHeader("X-User-Roles") String roles
    ) {
        manager(roles);

        RoomRequest request = roomRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu"));

        if ("APPROVED".equals(request.getStatus()) && !"CHECKOUT".equals(request.getType())) {
            return Map.of("success", true, "data", id);
        }
        if (!"PENDING".equals(request.getStatus()) && !"APPROVED".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yêu cầu chưa đủ điều kiện phê duyệt");
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
        } else if ("CHECKOUT".equals(type)) {
            if (request.getContractId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu hợp đồng trả phòng");
            }
            var contract = contractRepository.findForLeave(request.getContractId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"));
            if (!contract.getRoomId().equals(roomId) || !contract.getTenantId().equals(request.getTenantId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Yêu cầu không khớp phòng và người đại diện hợp đồng");
            }
            var existing = moveOutSettlementRepository.findByContractId(contract.getId());
            if (existing.isEmpty()) {
                if (contract.getStatus() != ContractStatus.ACTIVE) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Hợp đồng không còn hiệu lực");
                }
                LocalDate date = request.getMoveOutDate() != null ? request.getMoveOutDate() : LocalDate.now();
                boolean forfeit = contract.getEndDate() != null && date.isBefore(contract.getEndDate());
                BigDecimal deposit = contract.getDepositAmount() != null ? contract.getDepositAmount() : BigDecimal.ZERO;
                moveOutSettlementRepository.save(MoveOutSettlement.builder()
                        .contractId(contract.getId()).roomId(roomId).tenantId(contract.getTenantId())
                        .moveOutDate(date).depositAmount(deposit).forfeitDeposit(forfeit)
                        .refundAmount(forfeit ? BigDecimal.ZERO : deposit)
                        .bankAccount(request.getBankAccount()).bankName(request.getBankName()).accountHolder(request.getAccountHolder())
                        .reason(request.getNote()).status("APPROVED").refundStatus("PENDING").build());
            }
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
        BigDecimal refund = (settlement.isForfeitDeposit() ? BigDecimal.ZERO : deposit).subtract(deduction).max(BigDecimal.ZERO);

        var contract = contractRepository.findById(settlement.getContractId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"));
        for (var member : tenants.getMembers().getData()) {
            if (settlement.getContractId().equals(member.contractId()) && "ACTIVE".equals(member.status())) {
                tenants.updateMember(member.id(), Map.of("status", "MOVED_OUT"), "ROLE_STAFF");
            }
        }
        if (contract.getStatus() != ContractStatus.TERMINATED) {
            contracts.terminateContract(settlement.getContractId());
        }

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

    public record RoomRequestBody(
            String type,
            Long contractId,
            Long tenantId,
            Long targetRoomId,
            Long currentRoomId,
            Integer durationMonths,
            String note,
            Boolean forfeitDeposit,
            String status,
            LocalDateTime reviewedAt,
            LocalDate moveOutDate,
            String bankAccount,
            String bankName,
            String accountHolder
    ) {}

    public record SettlementRequestBody(
            Long contractId,
            Long roomId,
            Long tenantId,
            LocalDate moveOutDate,
            BigDecimal originalDeposit,
            BigDecimal depositAmount,
            BigDecimal unpaidUtilitiesFee,
            BigDecimal damageFee,
            String damageDescription,
            BigDecimal deductionAmount,
            BigDecimal refundAmount,
            String bankAccount,
            String bankName,
            String accountHolder,
            String refundStatus,
            LocalDateTime settledAt,
            String reason,
            String status
    ) {
        BigDecimal resolvedDeposit() {
            return originalDeposit != null ? originalDeposit : depositAmount;
        }
    }

    // --- Room Requests CRUD ---

    @GetMapping("/requests")
    public Map<String, Object> listRoomRequests() {
        return Map.of("success", true, "data", roomRequestRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> createRoomRequest(@RequestBody RoomRequestBody req) {
        if (req.type() == null || req.tenantId() == null || req.targetRoomId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type, tenantId, and targetRoomId are required");
        }
        Boolean forfeitDeposit = req.forfeitDeposit();
        if ("CHECKOUT".equals(req.type())) {
            if (req.contractId() == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu hợp đồng trả phòng");
            var contract = contractRepository.findForLeave(req.contractId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"));
            if (contract.getStatus() != ContractStatus.ACTIVE || !contract.getRoomId().equals(req.targetRoomId())
                    || !contract.getTenantId().equals(req.tenantId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hợp đồng không khớp người đại diện và phòng đang thuê");
            }
            var existing = roomRequestRepository.findByTenantId(req.tenantId()).stream()
                    .filter(q -> "CHECKOUT".equals(q.getType()) && req.contractId().equals(q.getContractId())
                            && !"REJECTED".equals(q.getStatus()) && !"CANCELLED".equals(q.getStatus())).findFirst();
            if (existing.isPresent()) return Map.of("success", true, "data", existing.get());
            LocalDate date = req.moveOutDate() != null ? req.moveOutDate() : LocalDate.now();
            forfeitDeposit = contract.getEndDate() != null && date.isBefore(contract.getEndDate());
        }
        RoomRequest saved = roomRequestRepository.save(RoomRequest.builder()
                .type(req.type())
                .contractId(req.contractId())
                .tenantId(req.tenantId())
                .targetRoomId(req.targetRoomId())
                .currentRoomId(req.currentRoomId())
                .durationMonths(req.durationMonths())
                .note(req.note())
                .moveOutDate(req.moveOutDate()).bankAccount(req.bankAccount()).bankName(req.bankName()).accountHolder(req.accountHolder())
                .forfeitDeposit(forfeitDeposit != null ? forfeitDeposit : false)
                .status(req.status() != null ? req.status() : "PENDING")
                .reviewedAt(req.reviewedAt())
                .build());
        return Map.of("success", true, "data", saved);
    }

    @PatchMapping("/requests/{id}")
    @Transactional
    public Map<String, Object> updateRoomRequest(
            @PathVariable Long id,
            @RequestBody RoomRequestBody req,
            @RequestHeader("X-User-Roles") String roles
    ) {
        manager(roles);
        RoomRequest existing = roomRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.type() != null) existing.setType(req.type());
        if (req.contractId() != null) existing.setContractId(req.contractId());
        if (req.tenantId() != null) existing.setTenantId(req.tenantId());
        if (req.targetRoomId() != null) existing.setTargetRoomId(req.targetRoomId());
        if (req.currentRoomId() != null) existing.setCurrentRoomId(req.currentRoomId());
        if (req.durationMonths() != null) existing.setDurationMonths(req.durationMonths());
        if (req.note() != null) existing.setNote(req.note());
        if (req.moveOutDate() != null) existing.setMoveOutDate(req.moveOutDate());
        if (req.bankAccount() != null) existing.setBankAccount(req.bankAccount());
        if (req.bankName() != null) existing.setBankName(req.bankName());
        if (req.accountHolder() != null) existing.setAccountHolder(req.accountHolder());
        if (req.forfeitDeposit() != null) existing.setForfeitDeposit(req.forfeitDeposit());
        if (req.status() != null) existing.setStatus(req.status());
        if (req.reviewedAt() != null) existing.setReviewedAt(req.reviewedAt());
        return Map.of("success", true, "data", roomRequestRepository.save(existing));
    }

    @DeleteMapping("/requests/{id}")
    @Transactional
    public Map<String, Object> deleteRoomRequest(
            @PathVariable Long id,
            @RequestHeader("X-User-Roles") String roles
    ) {
        manager(roles);
        if (!roomRequestRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        roomRequestRepository.deleteById(id);
        return Map.of("success", true, "data", id);
    }

    // --- Move-Out Settlements CRUD ---

    @GetMapping("/settlements")
    public Map<String, Object> listSettlements() {
        return Map.of("success", true, "data", moveOutSettlementRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }

    @PostMapping("/settlements")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> createSettlement(@RequestBody SettlementRequestBody req) {
        if (req.contractId() == null || req.moveOutDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu hợp đồng hoặc ngày trả phòng");
        }
        var contract = contractRepository.findForLeave(req.contractId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"));
        if (contract.getStatus() != ContractStatus.ACTIVE) throw new ResponseStatusException(HttpStatus.CONFLICT, "Hợp đồng không còn hiệu lực");
        var existing = moveOutSettlementRepository.findByContractId(req.contractId());
        if (existing.isPresent()) return Map.of("success", true, "data", existing.get());
        BigDecimal deposit = contract.getDepositAmount() != null ? contract.getDepositAmount() : BigDecimal.ZERO;
        boolean forfeit = contract.getEndDate() != null && req.moveOutDate().isBefore(contract.getEndDate());
        MoveOutSettlement saved = moveOutSettlementRepository.save(MoveOutSettlement.builder()
                .contractId(req.contractId())
                .roomId(contract.getRoomId())
                .tenantId(contract.getTenantId())
                .forfeitDeposit(forfeit)
                .moveOutDate(req.moveOutDate())
                .depositAmount(deposit)
                .unpaidUtilitiesFee(req.unpaidUtilitiesFee() != null ? req.unpaidUtilitiesFee() : BigDecimal.ZERO)
                .damageFee(req.damageFee() != null ? req.damageFee() : BigDecimal.ZERO)
                .damageDescription(req.damageDescription())
                .deductionAmount(req.deductionAmount() != null ? req.deductionAmount() : BigDecimal.ZERO)
                .refundAmount(forfeit ? BigDecimal.ZERO : deposit)
                .bankAccount(req.bankAccount())
                .bankName(req.bankName())
                .accountHolder(req.accountHolder())
                .refundStatus(req.refundStatus() != null ? req.refundStatus() : "PENDING")
                .settledAt(req.settledAt())
                .reason(req.reason())
                .status(req.status() != null ? req.status() : "PENDING")
                .build());
        return Map.of("success", true, "data", saved);
    }

    private void manager(String roles) {
        if (roles == null || (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }
}
