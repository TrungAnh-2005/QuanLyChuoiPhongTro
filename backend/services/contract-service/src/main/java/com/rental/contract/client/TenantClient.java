package com.rental.contract.client;

import com.rental.contract.client.dto.TenantDto;
import com.rental.contract.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import java.util.List;
import java.util.Map;

@FeignClient(name = "tenant-service")
public interface TenantClient {

    @GetMapping("/api/tenants/{id}")
    ApiResponse<TenantDto> getTenantById(@PathVariable("id") Long id);

    record Member(Long id, Long roomId, Long tenantId, Long contractId, String roleInRoom, String status) {}

    @GetMapping("/api/tenants/members")
    ApiResponse<List<Member>> getMembers();

    @PatchMapping("/api/tenants/members/{id}")
    ApiResponse<Member> updateMember(@PathVariable("id") Long id, @RequestBody Map<String, String> body,
                                   @RequestHeader("X-User-Roles") String roles);
}
