package com.rental.contract.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDto {
    private Long id;
    private String fullName;
    private String identityCard;
    private String phone;
    private String email;
    private String status;
}
