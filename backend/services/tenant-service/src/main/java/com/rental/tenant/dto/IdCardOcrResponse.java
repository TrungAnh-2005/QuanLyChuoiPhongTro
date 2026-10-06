package com.rental.tenant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdCardOcrResponse {

    private String idNumber;
    private String fullName;
    private String dateOfBirth;
    private String gender;
    private String hometown;
    private String permanentAddress;
    private String expiryDate;
    private Double confidenceScore;
    private Boolean isSuccess;
    private String notes;
}
