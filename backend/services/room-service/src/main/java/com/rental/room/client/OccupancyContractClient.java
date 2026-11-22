package com.rental.room.client;

import com.rental.room.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;

@FeignClient(name = "contract-service", contextId = "roomOccupancyContracts")
public interface OccupancyContractClient {
    record ContractPresence(Long id, Long roomId, String status) {}
    @GetMapping("/api/contracts")
    ApiResponse<List<ContractPresence>> contracts();
}
