package com.rental.tenant.controller;

import com.rental.tenant.dto.CreateTenantRequest;
import com.rental.tenant.dto.TenantResponse;
import com.rental.tenant.entity.Gender;
import com.rental.tenant.entity.RoomMember;
import com.rental.tenant.entity.RoommateRequest;
import com.rental.tenant.repository.RoomMemberRepository;
import com.rental.tenant.repository.RoommateRequestRepository;
import com.rental.tenant.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants/roommate-requests")
@RequiredArgsConstructor
public class RoommateWorkflowController {

    private final RoommateRequestRepository roommateRequestRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final TenantService tenantService;

    @PostMapping("/{id}/review")
    @Transactional
    public Object review(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @RequestHeader("X-User-Roles") String roles
    ) {
        if (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }

        RoommateRequest request = roommateRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy yêu cầu ở ghép"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Yêu cầu đã được xử lý trước đó");
        }

        boolean approved = Boolean.TRUE.equals(body.get("approved"));

        if (approved) {
            if (body.get("contractId") == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu thông tin hợp đồng bảo trợ (contractId)");
            }
            Long contractId = Long.valueOf(body.get("contractId").toString());

            TenantResponse newTenant = tenantService.createTenant(CreateTenantRequest.builder()
                    .fullName(request.getFullName())
                    .identityCard(request.getIdentityCard())
                    .phone(request.getPhone())
                    .birthDate(request.getBirthDate())
                    .gender(request.getGender() != null ? Gender.valueOf(request.getGender()) : Gender.OTHER)
                    .build());

            RoomMember newMember = RoomMember.builder()
                    .roomId(request.getRoomId())
                    .tenantId(newTenant.getId())
                    .contractId(contractId)
                    .roleInRoom("MEMBER")
                    .joinDate(LocalDate.now())
                    .status("ACTIVE")
                    .temporaryResidenceStatus("NOT_REGISTERED")
                    .build();
            roomMemberRepository.save(newMember);
        }

        request.setStatus(approved ? "APPROVED" : "REJECTED");
        request.setRejectionReason(body.getOrDefault("rejectionReason", "").toString());
        request.setReviewedAt(LocalDateTime.now());
        roommateRequestRepository.save(request);

        return Map.of("success", true, "data", id);
    }
}
