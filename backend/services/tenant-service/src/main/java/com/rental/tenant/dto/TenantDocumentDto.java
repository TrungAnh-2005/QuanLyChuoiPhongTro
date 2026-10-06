package com.rental.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantDocumentDto {
    private Long id;

    @NotBlank(message = "Document type is required")
    private String docType;

    @NotBlank(message = "File URL is required")
    private String fileUrl;

    private LocalDateTime uploadedAt;
}
