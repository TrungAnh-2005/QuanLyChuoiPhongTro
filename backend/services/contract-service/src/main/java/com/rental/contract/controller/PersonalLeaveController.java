package com.rental.contract.controller;

import com.rental.contract.client.BillingClient;
import com.rental.contract.client.TenantClient;
import com.rental.contract.entity.ContractStatus;
import com.rental.contract.repository.ContractRepository;
import com.rental.contract.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class PersonalLeaveController {
    private final ContractRepository contracts;
    private final ContractService contractService;
    private final TenantClient tenants;
    private final BillingClient billing;

    public record LeaveRequest(Long tenantId, Long successorTenantId, String reason) {}

    @PostMapping("/{id}/leave")
    @Transactional
    public Object leave(@PathVariable Long id, @RequestBody LeaveRequest body,
                        @RequestHeader("X-User-Email") String email,
                        @RequestHeader("X-User-Roles") String roles) {
        if (body.tenantId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu khách thuê rời phòng");
        }
        var tenant = tenants.getTenantById(body.tenantId()).getData();
        boolean manager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_STAFF");
        if (!manager && (tenant.getEmail() == null || !tenant.getEmail().equalsIgnoreCase(email))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn chỉ được rời phòng của mình");
        }
        var contract = contracts.findForLeave(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy hợp đồng"));
        if (contract.getStatus() != ContractStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hợp đồng không còn hiệu lực");
        }
        var members = tenants.getMembers().getData().stream()
                .filter(m -> Objects.equals(m.contractId(), id) && Objects.equals(m.roomId(), contract.getRoomId())
                        && "ACTIVE".equals(m.status())).toList();
        var ownMember = members.stream().filter(m -> Objects.equals(m.tenantId(), body.tenantId())).findFirst();
        boolean holder = Objects.equals(contract.getTenantId(), body.tenantId());
        if (!holder && ownMember.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không phải thành viên phòng này");
        }
        if (billing.getInvoices(body.tenantId()).stream().anyMatch(i ->
                Objects.equals(i.roomId(), contract.getRoomId()) && !"PAID".equals(i.status()) && !"CANCELLED".equals(i.status()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vui lòng thanh toán toàn bộ hóa đơn trước khi rời phòng");
        }
        var remaining = members.stream().filter(m -> !Objects.equals(m.tenantId(), body.tenantId())).toList();
        if (holder && !remaining.isEmpty()) {
            var successor = remaining.stream().filter(m -> Objects.equals(m.tenantId(), body.successorTenantId())).findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng chọn thành viên tiếp quản hợp đồng"));
            tenants.updateMember(successor.id(), Map.of("roleInRoom", "REPRESENTATIVE"), "ROLE_STAFF");
            contract.setTenantId(successor.tenantId());
            contracts.save(contract);
        } else if (holder) {
            contractService.terminateContract(id);
        }
        ownMember.ifPresent(m -> tenants.updateMember(m.id(), Map.of("status", "MOVED_OUT", "roleInRoom", "MEMBER"), "ROLE_STAFF"));
        return Map.of("success", true, "data", id);
    }
}
