package com.rental.tenant.service.impl;

import com.rental.tenant.dto.*;
import com.rental.tenant.entity.*;
import com.rental.tenant.exception.AppException;
import com.rental.tenant.repository.TenantContactRepository;
import com.rental.tenant.repository.TenantDocumentRepository;
import com.rental.tenant.repository.TenantRepository;
import com.rental.tenant.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TenantServiceImpl implements TenantService {

    private final TenantRepository tenantRepository;
    private final TenantDocumentRepository documentRepository;
    private final TenantContactRepository contactRepository;

    @Override
    @Transactional
    public TenantDetailResponse createTenant(CreateTenantRequest request) {
        if (tenantRepository.existsByIdentityCard(request.getIdentityCard())) {
            throw new AppException("Identity card (CCCD) already exists", HttpStatus.BAD_REQUEST, "IDENTITY_CARD_EXISTS");
        }

        if (tenantRepository.existsByPhone(request.getPhone())) {
            throw new AppException("Phone number already registered", HttpStatus.BAD_REQUEST, "PHONE_EXISTS");
        }

        Tenant tenant = Tenant.builder()
                .fullName(request.getFullName().trim())
                .identityCard(request.getIdentityCard().trim())
                .birthDate(request.getBirthDate())
                .gender(request.getGender() != null ? request.getGender() : Gender.OTHER)
                .phone(request.getPhone().trim())
                .email(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null)
                .hometown(request.getHometown())
                .address(request.getAddress())
                .startDate(request.getStartDate())
                .status(TenantStatus.ACTIVE)
                .documents(new ArrayList<>())
                .emergencyContacts(new ArrayList<>())
                .build();

        if (request.getDocuments() != null) {
            for (TenantDocumentDto docDto : request.getDocuments()) {
                TenantDocument doc = TenantDocument.builder()
                        .tenant(tenant)
                        .docType(docDto.getDocType())
                        .fileUrl(docDto.getFileUrl())
                        .build();
                tenant.getDocuments().add(doc);
            }
        }

        if (request.getEmergencyContacts() != null) {
            for (TenantContactDto contactDto : request.getEmergencyContacts()) {
                TenantContact contact = TenantContact.builder()
                        .tenant(tenant)
                        .contactName(contactDto.getContactName())
                        .phone(contactDto.getPhone())
                        .relationship(contactDto.getRelationship())
                        .build();
                tenant.getEmergencyContacts().add(contact);
            }
        }

        Tenant saved = tenantRepository.save(tenant);
        return mapToDetailResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantResponse> getAllTenants() {
        return tenantRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public TenantDetailResponse getTenantById(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new AppException("Tenant not found with id: " + id, HttpStatus.NOT_FOUND, "TENANT_NOT_FOUND"));

        return mapToDetailResponse(tenant);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TenantResponse> searchTenants(String keyword) {
        return tenantRepository.searchByKeyword(keyword != null ? keyword.trim() : null).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TenantDetailResponse updateTenant(Long id, UpdateTenantRequest request) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new AppException("Tenant not found with id: " + id, HttpStatus.NOT_FOUND, "TENANT_NOT_FOUND"));

        tenant.setFullName(request.getFullName().trim());
        tenant.setBirthDate(request.getBirthDate());
        if (request.getGender() != null) {
            tenant.setGender(request.getGender());
        }
        tenant.setPhone(request.getPhone().trim());
        tenant.setEmail(request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null);
        tenant.setHometown(request.getHometown());
        tenant.setAddress(request.getAddress());
        if (request.getStatus() != null) {
            tenant.setStatus(request.getStatus());
        }

        Tenant updated = tenantRepository.save(tenant);
        return mapToDetailResponse(updated);
    }

    @Override
    @Transactional
    public void deleteTenant(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new AppException("Tenant not found with id: " + id, HttpStatus.NOT_FOUND, "TENANT_NOT_FOUND"));

        tenantRepository.delete(tenant);
    }

    private TenantResponse mapToResponse(Tenant tenant) {
        return TenantResponse.builder()
                .id(tenant.getId())
                .fullName(tenant.getFullName())
                .identityCard(tenant.getIdentityCard())
                .birthDate(tenant.getBirthDate())
                .gender(tenant.getGender())
                .phone(tenant.getPhone())
                .email(tenant.getEmail())
                .hometown(tenant.getHometown())
                .address(tenant.getAddress())
                .startDate(tenant.getStartDate())
                .status(tenant.getStatus())
                .createdAt(tenant.getCreatedAt())
                .build();
    }

    private TenantDetailResponse mapToDetailResponse(Tenant tenant) {
        List<TenantDocumentDto> docs = tenant.getDocuments() != null
                ? tenant.getDocuments().stream().map(d -> TenantDocumentDto.builder()
                .id(d.getId())
                .docType(d.getDocType())
                .fileUrl(d.getFileUrl())
                .uploadedAt(d.getUploadedAt())
                .build()).collect(Collectors.toList())
                : List.of();

        List<TenantContactDto> contacts = tenant.getEmergencyContacts() != null
                ? tenant.getEmergencyContacts().stream().map(c -> TenantContactDto.builder()
                .id(c.getId())
                .contactName(c.getContactName())
                .phone(c.getPhone())
                .relationship(c.getRelationship())
                .build()).collect(Collectors.toList())
                : List.of();

        return TenantDetailResponse.builder()
                .id(tenant.getId())
                .fullName(tenant.getFullName())
                .identityCard(tenant.getIdentityCard())
                .birthDate(tenant.getBirthDate())
                .gender(tenant.getGender())
                .phone(tenant.getPhone())
                .email(tenant.getEmail())
                .hometown(tenant.getHometown())
                .address(tenant.getAddress())
                .startDate(tenant.getStartDate())
                .status(tenant.getStatus())
                .documents(docs)
                .emergencyContacts(contacts)
                .createdAt(tenant.getCreatedAt())
                .updatedAt(tenant.getUpdatedAt())
                .build();
    }
}
