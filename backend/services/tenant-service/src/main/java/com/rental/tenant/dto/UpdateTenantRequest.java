package com.rental.tenant.dto;

import com.rental.tenant.entity.Gender;
import com.rental.tenant.entity.TenantStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTenantRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    private LocalDate birthDate;

    private Gender gender;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    private String hometown;

    private String address;

    private TenantStatus status;
}
