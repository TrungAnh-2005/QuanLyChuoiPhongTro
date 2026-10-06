package com.rental.contract.service.impl;

import com.rental.contract.client.RoomClient;
import com.rental.contract.client.TenantClient;
import com.rental.contract.client.dto.RoomDto;
import com.rental.contract.client.dto.TenantDto;
import com.rental.contract.client.dto.UpdateRoomStatusDto;
import com.rental.contract.dto.ApiResponse;
import com.rental.contract.dto.ContractResponse;
import com.rental.contract.dto.CreateContractRequest;
import com.rental.contract.dto.RenewContractRequest;
import com.rental.contract.dto.event.ContractEventDTO;
import com.rental.contract.entity.Contract;
import com.rental.contract.entity.ContractStatus;
import com.rental.contract.exception.AppException;
import com.rental.contract.publisher.ContractEventPublisher;
import com.rental.contract.repository.ContractRepository;
import com.rental.contract.service.ContractService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractServiceImpl implements ContractService {

    private final ContractRepository contractRepository;
    private final TenantClient tenantClient;
    private final RoomClient roomClient;
    private final ContractEventPublisher eventPublisher;

    @Override
    @Transactional
    public ContractResponse createContract(CreateContractRequest request) {
        TenantDto tenant;
        try {
            ApiResponse<TenantDto> tenantRes = tenantClient.getTenantById(request.getTenantId());
            if (tenantRes == null || tenantRes.getData() == null) {
                throw new AppException("Tenant not found with id: " + request.getTenantId(), HttpStatus.NOT_FOUND, "TENANT_NOT_FOUND");
            }
            tenant = tenantRes.getData();
        } catch (Exception e) {
            log.error("Failed to verify tenant with id: {}", request.getTenantId(), e);
            throw new AppException("Failed to verify tenant: " + e.getMessage(), HttpStatus.BAD_REQUEST, "TENANT_VERIFICATION_FAILED");
        }

        RoomDto room;
        try {
            ApiResponse<RoomDto> roomRes = roomClient.getRoomById(request.getRoomId());
            if (roomRes == null || roomRes.getData() == null) {
                throw new AppException("Room not found with id: " + request.getRoomId(), HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND");
            }
            room = roomRes.getData();
        } catch (Exception e) {
            log.error("Failed to verify room with id: {}", request.getRoomId(), e);
            throw new AppException("Failed to verify room: " + e.getMessage(), HttpStatus.BAD_REQUEST, "ROOM_VERIFICATION_FAILED");
        }

        if (!"AVAILABLE".equalsIgnoreCase(room.getStatus())) {
            throw new AppException("Room is not available for contract. Current status: " + room.getStatus(),
                    HttpStatus.BAD_REQUEST, "ROOM_NOT_AVAILABLE");
        }

        try {
            roomClient.updateRoomStatus(request.getRoomId(), new UpdateRoomStatusDto("OCCUPIED"));
        } catch (Exception e) {
            log.error("Failed to update room status to OCCUPIED", e);
            throw new AppException("Failed to lock room status: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR, "ROOM_UPDATE_FAILED");
        }

        String contractCode = "HD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Contract contract = Contract.builder()
                .contractCode(contractCode)
                .tenantId(request.getTenantId())
                .roomId(request.getRoomId())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .rentalPrice(request.getRentalPrice())
                .depositAmount(request.getDepositAmount())
                .paymentCycle(request.getPaymentCycle() != null ? request.getPaymentCycle() : 1)
                .terms(request.getTerms())
                .status(ContractStatus.ACTIVE)
                .build();

        Contract saved = contractRepository.save(contract);

        ContractEventDTO event = ContractEventDTO.builder()
                .contractId(saved.getId())
                .tenantId(saved.getTenantId())
                .roomId(saved.getRoomId())
                .status(saved.getStatus().name())
                .rentalPrice(saved.getRentalPrice())
                .build();
        eventPublisher.publishContractCreated(event);

        return mapToResponse(saved, tenant.getFullName(), room.getRoomNumber());
    }

    @Override
    @Transactional
    public ContractResponse terminateContract(Long id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new AppException("Contract not found with id: " + id, HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND"));

        if (contract.getStatus() == ContractStatus.TERMINATED) {
            throw new AppException("Contract is already terminated", HttpStatus.BAD_REQUEST, "CONTRACT_ALREADY_TERMINATED");
        }

        contract.setStatus(ContractStatus.TERMINATED);
        Contract saved = contractRepository.save(contract);

        try {
            roomClient.updateRoomStatus(contract.getRoomId(), new UpdateRoomStatusDto("AVAILABLE"));
        } catch (Exception e) {
            log.error("Failed to release room status back to AVAILABLE", e);
        }

        ContractEventDTO event = ContractEventDTO.builder()
                .contractId(saved.getId())
                .tenantId(saved.getTenantId())
                .roomId(saved.getRoomId())
                .status(saved.getStatus().name())
                .rentalPrice(saved.getRentalPrice())
                .build();
        eventPublisher.publishContractTerminated(event);

        return mapToResponse(saved, null, null);
    }

    @Override
    @Transactional
    public ContractResponse renewContract(Long id, RenewContractRequest request) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new AppException("Contract not found with id: " + id, HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND"));

        if (contract.getStatus() == ContractStatus.TERMINATED) {
            throw new AppException("Cannot renew a terminated contract", HttpStatus.BAD_REQUEST, "CONTRACT_TERMINATED");
        }

        contract.setEndDate(request.getNewEndDate());
        if (request.getNewRentalPrice() != null) {
            contract.setRentalPrice(request.getNewRentalPrice());
        }
        contract.setStatus(ContractStatus.ACTIVE);

        Contract saved = contractRepository.save(contract);
        return mapToResponse(saved, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractResponse> getAllContracts() {
        return contractRepository.findAll().stream()
                .map(c -> mapToResponse(c, null, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ContractResponse getContractById(Long id) {
        Contract contract = contractRepository.findById(id)
                .orElseThrow(() -> new AppException("Contract not found with id: " + id, HttpStatus.NOT_FOUND, "CONTRACT_NOT_FOUND"));

        String tenantName = null;
        try {
            ApiResponse<TenantDto> res = tenantClient.getTenantById(contract.getTenantId());
            if (res != null && res.getData() != null) {
                tenantName = res.getData().getFullName();
            }
        } catch (Exception ignored) {}

        String roomNumber = null;
        try {
            ApiResponse<RoomDto> res = roomClient.getRoomById(contract.getRoomId());
            if (res != null && res.getData() != null) {
                roomNumber = res.getData().getRoomNumber();
            }
        } catch (Exception ignored) {}

        return mapToResponse(contract, tenantName, roomNumber);
    }

    private ContractResponse mapToResponse(Contract contract, String tenantName, String roomNumber) {
        return ContractResponse.builder()
                .id(contract.getId())
                .contractCode(contract.getContractCode())
                .tenantId(contract.getTenantId())
                .tenantName(tenantName)
                .roomId(contract.getRoomId())
                .roomNumber(roomNumber)
                .startDate(contract.getStartDate())
                .endDate(contract.getEndDate())
                .rentalPrice(contract.getRentalPrice())
                .depositAmount(contract.getDepositAmount())
                .paymentCycle(contract.getPaymentCycle())
                .terms(contract.getTerms())
                .status(contract.getStatus())
                .createdAt(contract.getCreatedAt())
                .updatedAt(contract.getUpdatedAt())
                .build();
    }
}
