package com.rental.tenant.dto;

import com.rental.tenant.entity.Gender;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTenantRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Identity card (CCCD) is required")
    @Size(min = 9, max = 20, message = "Identity card must be between 9 and 20 characters")
    private String identityCard;

    private LocalDate birthDate;

    @Builder.Default
    private Gender gender = Gender.OTHER;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    private String hometown;

    private String address;

    private LocalDate startDate;

    @Valid
    private List<TenantDocumentDto> documents;

    @Valid
    private List<TenantContactDto> emergencyContacts;
}
