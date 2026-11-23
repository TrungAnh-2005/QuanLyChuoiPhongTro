package com.rental.maintenance.service.impl;

import com.rental.maintenance.dto.CreateMaintenanceRequest;
import com.rental.maintenance.dto.MaintenanceResponse;
import com.rental.maintenance.dto.UpdateMaintenanceStatusRequest;
import com.rental.maintenance.dto.RoomMaintenanceRequest;
import com.rental.maintenance.dto.RoomMaintenanceSnapshot;
import com.rental.maintenance.dto.RoomLookupResponse;
import com.rental.maintenance.client.RoomClient;
import com.rental.maintenance.dto.event.MaintenanceEventDTO;
import com.rental.maintenance.entity.MaintenancePriority;
import com.rental.maintenance.entity.MaintenanceRequest;
import com.rental.maintenance.entity.MaintenanceStatus;
import com.rental.maintenance.exception.ResourceNotFoundException;
import com.rental.maintenance.exception.BadRequestException;
import com.rental.maintenance.publisher.MaintenanceEventPublisher;
import com.rental.maintenance.repository.MaintenanceRepository;
import com.rental.maintenance.service.MaintenanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import feign.FeignException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceServiceImpl implements MaintenanceService {

    private final MaintenanceRepository maintenanceRepository;
    private final MaintenanceEventPublisher maintenanceEventPublisher;
    private final RoomClient roomClient;
    private final PlatformTransactionManager transactionManager;

    @Override
    public MaintenanceResponse createMaintenanceRequest(CreateMaintenanceRequest request) {
        boolean blocking = Boolean.TRUE.equals(request.getBlocksRental());
        if (!blocking && request.getTenantId() == null) {
            throw new BadRequestException("Tenant ID is required for a nonblocking maintenance request");
        }
        MaintenancePriority priority = request.getPriority() != null ? request.getPriority() : MaintenancePriority.MEDIUM;

        MaintenanceRequest maintenanceRequest = MaintenanceRequest.builder()
                .roomId(request.getRoomId())
                .tenantId(request.getTenantId())
                .blocksRental(blocking)
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .priority(priority)
                .status(MaintenanceStatus.PENDING)
                .requestedDate(LocalDateTime.now())
                .build();

        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        if (!blocking) {
            return transaction.execute(status -> {
                MaintenanceRequest saved = maintenanceRepository.save(maintenanceRequest);
                maintenanceEventPublisher.publishMaintenanceCreated(toEvent(saved));
                return mapToResponse(saved);
            });
        }

        // Commit the audit before the remote claim so even an ambiguous timeout has a recoverable ticket.
        transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        MaintenanceRequest savedRequest = transaction.execute(status -> maintenanceRepository.saveAndFlush(maintenanceRequest));
        AtomicBoolean claimed = new AtomicBoolean();
        try {
            transaction.executeWithoutResult(status -> {
                MaintenanceRequest locked = maintenanceRepository.findByIdForUpdate(savedRequest.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Maintenance request not found: " + savedRequest.getId()));
                if (isClosed(locked.getStatus())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Maintenance ticket was already closed before room claim");
                }
                roomClient.startMaintenance(locked.getRoomId(), new RoomMaintenanceRequest(locked.getId()));
                claimed.set(true);
                maintenanceEventPublisher.publishMaintenanceCreated(toEvent(locked));
            });
        } catch (RuntimeException failure) {
            if (failure instanceof ResponseStatusException) {
                throw failure;
            }
            boolean definiteRejection = !claimed.get() && failure instanceof FeignException remote
                    && (remote.status() == 400 || remote.status() == 401 || remote.status() == 403
                    || remote.status() == 404 || remote.status() == 409 || remote.status() == 422);
            recoverFailedCreation(savedRequest, definiteRejection);
            throw remoteFailure(failure, "Could not start maintenance; retained ticket " + savedRequest.getId());
        }

        return mapToResponse(savedRequest);
    }

    private void recoverFailedCreation(MaintenanceRequest ticket, boolean definiteRejection) {
        TransactionTemplate recovery = new TransactionTemplate(transactionManager);
        recovery.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        recovery.executeWithoutResult(status -> {
            MaintenanceRequest locked = maintenanceRepository.findByIdForUpdate(ticket.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Maintenance request not found: " + ticket.getId()));
            if (isClosed(locked.getStatus())) {
                return;
            }
            boolean released = definiteRejection;
            if (!definiteRejection) {
                try {
                    roomClient.finishMaintenance(locked.getRoomId(), new RoomMaintenanceRequest(locked.getId()));
                    released = true;
                } catch (RuntimeException compensationFailure) {
                    log.error("Could not release room {} for failed maintenance ticket {}; ticket retained for recovery",
                            locked.getRoomId(), locked.getId(), compensationFailure);
                }
            }
            locked.setStatus(definiteRejection ? MaintenanceStatus.REJECTED
                    : released ? MaintenanceStatus.CANCELLED : MaintenanceStatus.PENDING);
            locked.setNote(released ? "Room claim failed or was compensated; ticket retained for audit."
                    : "Room claim uncertain. Retry cancellation of ticket " + locked.getId() + " to release its matching room.");
            maintenanceRepository.saveAndFlush(locked);
        });
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
    @Transactional
    public MaintenanceResponse updateMaintenanceStatus(Long id, UpdateMaintenanceStatusRequest request) {
        MaintenanceRequest maintenanceRequest = maintenanceRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Maintenance request not found with id: " + id));

        boolean blocking = Boolean.TRUE.equals(maintenanceRequest.getBlocksRental());
        if (blocking && isClosed(maintenanceRequest.getStatus())) {
            if (!isClosed(request.getStatus())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "A closed blocking maintenance ticket cannot be reopened; create a new ticket");
            }
            if (request.getStatus() == maintenanceRequest.getStatus()
                    && (request.getCost() != null || request.getNote() != null
                    || request.getAssignedTo() != null && !request.getAssignedTo().isBlank())) {
                applyMetadata(maintenanceRequest, request);
                return mapToResponse(maintenanceRepository.save(maintenanceRequest));
            }
            return mapToResponse(maintenanceRequest);
        }
        if (blocking && isClosed(request.getStatus())) {
            try {
                roomClient.finishMaintenance(maintenanceRequest.getRoomId(), new RoomMaintenanceRequest(id));
            } catch (RuntimeException failure) {
                boolean canReconcile = failure instanceof FeignException remote
                        && (remote.status() == 409 || remote.status() == 404);
                if (!canReconcile || !roomOwnershipIsGone(maintenanceRequest)) {
                    throw remoteFailure(failure, "Room release failed; maintenance ticket remains open");
                }
            }
        } else if (!blocking && (request.getStatus() == MaintenanceStatus.COMPLETED || request.getStatus() == MaintenanceStatus.RESOLVED)) {
            try {
                RoomLookupResponse lookup = roomClient.getRoom(maintenanceRequest.getRoomId());
                RoomMaintenanceSnapshot room = lookup == null ? null : lookup.data();
                if (room != null && "MAINTENANCE".equals(room.status())
                        && (room.maintenanceRequestId() == null || Objects.equals(room.maintenanceRequestId(), id))) {
                    roomClient.finishMaintenance(maintenanceRequest.getRoomId(), new RoomMaintenanceRequest(id));
                }
            } catch (RuntimeException ignored) {
                log.warn("Could not auto-reopen MAINTENANCE room {} after completing ticket {}",
                        maintenanceRequest.getRoomId(), id, ignored);
            }
        }

        maintenanceRequest.setStatus(request.getStatus());

        applyMetadata(maintenanceRequest, request);

        if (request.getStatus() == MaintenanceStatus.COMPLETED || request.getStatus() == MaintenanceStatus.RESOLVED) {
            maintenanceRequest.setResolvedAt(LocalDateTime.now());
        }

        MaintenanceRequest updated = maintenanceRepository.save(maintenanceRequest);

        if (updated.getStatus() == MaintenanceStatus.COMPLETED || updated.getStatus() == MaintenanceStatus.RESOLVED) {
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

            if (blocking) {
                publishBlockingCompletionAfterCommit(event);
            } else {
                maintenanceEventPublisher.publishMaintenanceCompleted(event);
            }
        }

        return mapToResponse(updated);
    }

    private void applyMetadata(MaintenanceRequest ticket, UpdateMaintenanceStatusRequest request) {
        if (request.getCost() != null) {
            ticket.setCost(request.getCost());
        }
        if (request.getAssignedTo() != null && !request.getAssignedTo().isBlank()) {
            ticket.setAssignedTo(request.getAssignedTo());
        }
        if (request.getNote() != null) {
            ticket.setNote(request.getNote());
        }
    }

    private boolean roomOwnershipIsGone(MaintenanceRequest ticket) {
        RoomLookupResponse response;
        try {
            response = roomClient.getRoom(ticket.getRoomId());
        } catch (FeignException remote) {
            if (remote.status() == 404) {
                return true;
            }
            throw remoteFailure(remote, "Could not verify room ownership; maintenance ticket remains open");
        } catch (RuntimeException failure) {
            throw remoteFailure(failure, "Could not verify room ownership; maintenance ticket remains open");
        }
        RoomMaintenanceSnapshot room = response == null ? null : response.data();
        if (response == null || !Boolean.TRUE.equals(response.success()) || room == null || room.status() == null
                || !Set.of("AVAILABLE", "HOLDING", "OCCUPIED", "LOCKED", "MAINTENANCE").contains(room.status())) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Invalid room ownership response; maintenance ticket remains open");
        }
        // A previous release may have committed even if its response or our local commit was lost.
        // Close only the old audit; never release the room's subsequent reservation or maintenance owner.
        return !"MAINTENANCE".equals(room.status()) || !Objects.equals(ticket.getId(), room.maintenanceRequestId());
    }

    private boolean isClosed(MaintenanceStatus status) {
        return status == MaintenanceStatus.COMPLETED || status == MaintenanceStatus.RESOLVED
                || status == MaintenanceStatus.CANCELLED || status == MaintenanceStatus.REJECTED;
    }

    private ResponseStatusException remoteFailure(RuntimeException failure, String message) {
        HttpStatus status = HttpStatus.SERVICE_UNAVAILABLE;
        if (failure instanceof FeignException remote) {
            if (remote.status() == 409) status = HttpStatus.CONFLICT;
            else if (remote.status() == 404) status = HttpStatus.NOT_FOUND;
            else if (remote.status() == 400) status = HttpStatus.BAD_REQUEST;
        }
        return new ResponseStatusException(status, message, failure);
    }

    private MaintenanceEventDTO toEvent(MaintenanceRequest ticket) {
        return MaintenanceEventDTO.builder().requestId(ticket.getId()).roomId(ticket.getRoomId())
                .tenantId(ticket.getTenantId()).title(ticket.getTitle()).priority(ticket.getPriority().name())
                .status(ticket.getStatus().name()).cost(ticket.getCost()).timestamp(LocalDateTime.now()).build();
    }

    private void publishBlockingCompletionAfterCommit(MaintenanceEventDTO event) {
        Runnable publish = () -> {
            try {
                maintenanceEventPublisher.publishMaintenanceCompleted(event);
            } catch (RuntimeException failure) {
                log.warn("Maintenance ticket {} is closed and room released; completion notification failed",
                        event.getRequestId(), failure);
            }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish.run();
                }
            });
        } else {
            publish.run();
        }
    }

    private MaintenanceResponse mapToResponse(MaintenanceRequest request) {
        return MaintenanceResponse.builder()
                .id(request.getId())
                .roomId(request.getRoomId())
                .tenantId(request.getTenantId())
                .blocksRental(Boolean.TRUE.equals(request.getBlocksRental()))
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
