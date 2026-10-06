package com.rental.maintenance.service.impl;

import com.rental.maintenance.dto.CreateMaintenanceRequest;
import com.rental.maintenance.dto.MaintenanceResponse;
import com.rental.maintenance.dto.UpdateMaintenanceStatusRequest;
import com.rental.maintenance.dto.event.MaintenanceEventDTO;
import com.rental.maintenance.entity.MaintenancePriority;
import com.rental.maintenance.entity.MaintenanceRequest;
import com.rental.maintenance.entity.MaintenanceStatus;
import com.rental.maintenance.exception.ResourceNotFoundException;
import com.rental.maintenance.publisher.MaintenanceEventPublisher;
import com.rental.maintenance.repository.MaintenanceRepository;
import com.rental.maintenance.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final MaintenanceEventPublisher maintenanceEventPublisher;

    @Override
    @Transactional
    public MaintenanceResponse createMaintenanceRequest(CreateMaintenanceRequest request) {
        MaintenancePriority priority = request.getPriority() != null ? request.getPriority() : MaintenancePriority.MEDIUM;

        MaintenanceRequest maintenanceRequest = MaintenanceRequest.builder()
                .roomId(request.getRoomId())
                .tenantId(request.getTenantId())
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .priority(priority)
                .status(MaintenanceStatus.PENDING)
                .requestedDate(LocalDateTime.now())
                .build();

        MaintenanceRequest savedRequest = maintenanceRepository.save(maintenanceRequest);

        MaintenanceEventDTO event = MaintenanceEventDTO.builder()
                .requestId(savedRequest.getId())
                .roomId(savedRequest.getRoomId())
                .tenantId(savedRequest.getTenantId())
                .title(savedRequest.getTitle())
                .priority(savedRequest.getPriority().name())
                .status(savedRequest.getStatus().name())
                .cost(savedRequest.getCost())
                .timestamp(LocalDateTime.now())
                .build();

        maintenanceEventPublisher.publishMaintenanceCreated(event);

        return mapToResponse(savedRequest);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MaintenanceResponse> getMaintenanceRequests(Long roomId, Long tenantId, MaintenanceStatus status, MaintenancePriority priority) {
        List<MaintenanceRequest> list;

        if (roomId != null) {
            list = maintenanceRepository.findByRoomId(roomId);
        } else if (tenantId != null) {
            list = maintenanceRepository.findByTenantId(tenantId);
        } else if (status != null) {
            list = maintenanceRepository.findByStatus(status);
        } else if (priority != null) {
            list = maintenanceRepository.findByPriority(priority);
        } else {
            list = maintenanceRepository.findAll();
        }

        return list.stream()
                .filter(item -> status == null || item.getStatus() == status)
                .filter(item -> priority == null || item.getPriority() == priority)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public MaintenanceResponse getMaintenanceRequestById(Long id) {
        MaintenanceRequest request = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance request not found with id: " + id));
        return mapToResponse(request);
    }

    @Override
    @Transactional
    public MaintenanceResponse updateMaintenanceStatus(Long id, UpdateMaintenanceStatusRequest request) {
        MaintenanceRequest maintenanceRequest = maintenanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance request not found with id: " + id));

        maintenanceRequest.setStatus(request.getStatus());

        if (request.getCost() != null) {
            maintenanceRequest.setCost(request.getCost());
        }

        if (request.getAssignedTo() != null && !request.getAssignedTo().isBlank()) {
            maintenanceRequest.setAssignedTo(request.getAssignedTo());
        }

        if (request.getNote() != null) {
            maintenanceRequest.setNote(request.getNote());
        }

        if (request.getStatus() == MaintenanceStatus.COMPLETED) {
            maintenanceRequest.setResolvedAt(LocalDateTime.now());
        }

        MaintenanceRequest updated = maintenanceRepository.save(maintenanceRequest);

        if (updated.getStatus() == MaintenanceStatus.COMPLETED) {
            MaintenanceEventDTO event = MaintenanceEventDTO.builder()
                    .requestId(updated.getId())
                    .roomId(updated.getRoomId())
                    .tenantId(updated.getTenantId())
                    .title(updated.getTitle())
                    .priority(updated.getPriority().name())
                    .status(updated.getStatus().name())
                    .cost(updated.getCost())
                    .timestamp(LocalDateTime.now())
                    .build();

            maintenanceEventPublisher.publishMaintenanceCompleted(event);
        }

        return mapToResponse(updated);
    }

    private MaintenanceResponse mapToResponse(MaintenanceRequest request) {
        return MaintenanceResponse.builder()
                .id(request.getId())
                .roomId(request.getRoomId())
                .tenantId(request.getTenantId())
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .priority(request.getPriority())
                .status(request.getStatus())
                .cost(request.getCost())
                .assignedTo(request.getAssignedTo())
                .note(request.getNote())
                .requestedDate(request.getRequestedDate())
                .resolvedAt(request.getResolvedAt())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }
}
