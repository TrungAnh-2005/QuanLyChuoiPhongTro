package com.rental.room.client;

import com.rental.room.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;

@FeignClient(name = "tenant-service", contextId = "roomOccupancyMembers")
public interface OccupancyMemberClient {
    record MemberPresence(Long id, Long roomId, String status) {}
    @GetMapping("/api/tenants/members")
    ApiResponse<List<MemberPresence>> members();
}
