package com.rental.tenant.controller;

import com.rental.tenant.entity.RoomMember;
import com.rental.tenant.repository.RoomMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants/members")
@RequiredArgsConstructor
public class RoomMemberController {

    private final RoomMemberRepository roomMemberRepository;

    public record RoomMemberRequest(
            Long roomId,
            Long tenantId,
            Long contractId,
            String roleInRoom,
            LocalDate joinDate,
            String temporaryResidenceStatus,
            String tempResidenceStatus,
            String status
    ) {
        String resolvedTempResidenceStatus() {
            return temporaryResidenceStatus != null ? temporaryResidenceStatus : tempResidenceStatus;
        }
    }

    private void requireManager(String roles) {
        if (roles == null || (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Manager role required");
        }
    }

    @GetMapping
    public Map<String, Object> list() {
        return Map.of("success", true, "data", roomMemberRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> create(
            @RequestBody RoomMemberRequest req,
            @RequestHeader("X-User-Roles") String roles) {
        requireManager(roles);
        if (req.roomId() == null || req.tenantId() == null || req.contractId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roomId, tenantId, and contractId are required");
        }
        String tempStatus = req.resolvedTempResidenceStatus();
        RoomMember saved = roomMemberRepository.save(RoomMember.builder()
                .roomId(req.roomId())
                .tenantId(req.tenantId())
                .contractId(req.contractId())
                .roleInRoom(req.roleInRoom() != null ? req.roleInRoom() : "MEMBER")
                .joinDate(req.joinDate() != null ? req.joinDate() : LocalDate.now())
                .tempResidenceStatus(tempStatus != null ? tempStatus : "NOT_REGISTERED")
                .status(req.status() != null ? req.status() : "ACTIVE")
                .build());
        return Map.of("success", true, "data", saved);
    }

    @PatchMapping("/{id}")
    @Transactional
    public Map<String, Object> update(
            @PathVariable Long id,
            @RequestBody RoomMemberRequest req,
            @RequestHeader("X-User-Roles") String roles) {
        requireManager(roles);
        RoomMember existing = roomMemberRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.roomId() != null) existing.setRoomId(req.roomId());
        if (req.tenantId() != null) existing.setTenantId(req.tenantId());
        if (req.contractId() != null) existing.setContractId(req.contractId());
        if (req.roleInRoom() != null) existing.setRoleInRoom(req.roleInRoom());
        if (req.joinDate() != null) existing.setJoinDate(req.joinDate());
        String tempStatus = req.resolvedTempResidenceStatus();
        if (tempStatus != null) existing.setTempResidenceStatus(tempStatus);
        if (req.status() != null) existing.setStatus(req.status());
        return Map.of("success", true, "data", roomMemberRepository.save(existing));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public Map<String, Object> delete(
            @PathVariable Long id,
            @RequestHeader("X-User-Roles") String roles) {
        requireManager(roles);
        if (!roomMemberRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
        roomMemberRepository.deleteById(id);
        return Map.of("success", true, "data", id);
    }
}

