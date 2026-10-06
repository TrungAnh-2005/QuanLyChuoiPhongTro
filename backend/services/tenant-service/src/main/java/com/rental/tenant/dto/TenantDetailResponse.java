package com.rental.tenant.dto;

import com.rental.tenant.entity.Gender;
import com.rental.tenant.entity.TenantStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDetailResponse {
    private Long id;
    private String fullName;
    private String identityCard;
    private LocalDate birthDate;
    private Gender gender;
    private String phone;
    private String email;
    private String hometown;
    private String address;
    private LocalDate startDate;
    private TenantStatus status;
    private List<TenantDocumentDto> documents;
    private List<TenantContactDto> emergencyContacts;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
