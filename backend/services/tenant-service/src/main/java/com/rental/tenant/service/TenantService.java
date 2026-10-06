package com.rental.tenant.service;

import com.rental.tenant.dto.*;

import java.util.List;

public interface TenantService {
    TenantDetailResponse createTenant(CreateTenantRequest request);
    List<TenantResponse> getAllTenants();
    TenantDetailResponse getTenantById(Long id);
    List<TenantResponse> searchTenants(String keyword);
    TenantDetailResponse updateTenant(Long id, UpdateTenantRequest request);
    void deleteTenant(Long id);
}
