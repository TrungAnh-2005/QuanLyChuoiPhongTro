package com.rental.meter.controller;

import com.rental.meter.entity.MeterDispute;
import com.rental.meter.repository.MeterDisputeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/meters/disputes")
@RequiredArgsConstructor
public class MeterDisputeController {

    private final MeterDisputeRepository meterDisputeRepository;

    public record MeterDisputeRequest(
            Long roomId,
            Long tenantId,
            String recordedPeriod,
            String meterType,
            BigDecimal systemReading,
            BigDecimal reportedReading,
            String note,
            String imageUrl,
            String status,
            String resolutionNotes,
            LocalDateTime resolvedAt
    ) {}

    private void requireManager(String roles) {
        if (roles == null || (!roles.contains("ROLE_ADMIN") && !roles.contains("ROLE_STAFF"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    @GetMapping
    public Map<String, Object> list() {
        return Map.of("success", true, "data", meterDisputeRepository.findAll(Sort.by(Sort.Direction.DESC, "id")));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String, Object> create(@RequestBody MeterDisputeRequest req) {
        if (req.roomId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "roomId is required");
        }
        MeterDispute saved = meterDisputeRepository.save(MeterDispute.builder()
                .roomId(req.roomId())
                .tenantId(req.tenantId())
                .recordedPeriod(req.recordedPeriod())
                .meterType(req.meterType())
                .systemReading(req.systemReading())
                .reportedReading(req.reportedReading())
                .note(req.note())
                .imageUrl(req.imageUrl())
                .status(req.status() != null ? req.status() : "PENDING")
                .resolutionNotes(req.resolutionNotes())
                .resolvedAt(req.resolvedAt())
                .build());
        return Map.of("success", true, "data", saved);
    }

    @PatchMapping("/{id}")
    @Transactional
    public Map<String, Object> update(
            @PathVariable Long id,
            @RequestBody MeterDisputeRequest req,
            @RequestHeader("X-User-Roles") String roles
    ) {
        requireManager(roles);
        MeterDispute existing = meterDisputeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (req.roomId() != null) existing.setRoomId(req.roomId());
        if (req.tenantId() != null) existing.setTenantId(req.tenantId());
        if (req.recordedPeriod() != null) existing.setRecordedPeriod(req.recordedPeriod());
        if (req.meterType() != null) existing.setMeterType(req.meterType());
        if (req.systemReading() != null) existing.setSystemReading(req.systemReading());
        if (req.reportedReading() != null) existing.setReportedReading(req.reportedReading());
        if (req.note() != null) existing.setNote(req.note());
        if (req.imageUrl() != null) existing.setImageUrl(req.imageUrl());
        if (req.status() != null) {
            if (!java.util.Set.of("PENDING", "RESOLVED", "REJECTED").contains(req.status())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid dispute status");
            }
            existing.setStatus(req.status());
            existing.setResolvedAt("PENDING".equals(req.status()) ? null : LocalDateTime.now());
        }
        if (req.resolutionNotes() != null) existing.setResolutionNotes(req.resolutionNotes());
        return Map.of("success", true, "data", meterDisputeRepository.save(existing));
    }

}

