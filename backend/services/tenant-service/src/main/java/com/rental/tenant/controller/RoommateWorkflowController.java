package com.rental.tenant.controller;

import com.rental.tenant.dto.CreateTenantRequest;
import com.rental.tenant.dto.TenantDetailResponse;
import com.rental.tenant.entity.Gender;
import com.rental.tenant.entity.RoomMember;
import com.rental.tenant.entity.RoommateRequest;
import com.rental.tenant.repository.RoomMemberRepository;
import com.rental.tenant.repository.RoommateRequestRepository;
import com.rental.tenant.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
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

    public record RoommateRequestBody(
            Long roomId,
            Long requestedByTenantId,
            String fullName,
            String identityCard,
            String phone,
            LocalDate birthDate,
            String gender,
            String hometown,
            String cccdFrontUrl,
            String cccdBackUrl,
            String note,
            String status,
            String rejectionReason
    ) {}

    private void requireManager(String roles) {
        if (roles == null || (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping
    public Map<String, Object> list() {
        return Map.of("success", true, "data", roommateRequestRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> create(@RequestBody RoommateRequestBody req) {
        if (req.roomId() == null || req.fullName() == null || req.identityCard() == null || req.phone() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roomId, fullName, identityCard, and phone are required");
        }
        RoommateRequest saved = roommateRequestRepository.save(RoommateRequest.builder()
                .roomId(req.roomId())
                .requestedByTenantId(req.requestedByTenantId())
                .fullName(req.fullName())
                .identityCard(req.identityCard())
                .phone(req.phone())
                .birthDate(req.birthDate())
                .gender(req.gender())
                .hometown(req.hometown())
                .cccdFrontUrl(req.cccdFrontUrl())
                .cccdBackUrl(req.cccdBackUrl())
                .note(req.note())
                .status(req.status() != null ? req.status() : "PENDING")
                .build());
        return Map.of("success", true, "data", saved);
    }

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

            TenantDetailResponse newTenant = tenantService.createTenant(CreateTenantRequest.builder()
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
                    .tempResidenceStatus("NOT_REGISTERED")
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
