package com.rental.contract.client;

import com.rental.contract.client.dto.TenantDto;
import com.rental.contract.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "tenant-service")
public interface TenantClient {

    @GetMapping("/api/tenants/{id}")
    ApiResponse<TenantDto> getTenantById(@PathVariable("id") Long id);
}
