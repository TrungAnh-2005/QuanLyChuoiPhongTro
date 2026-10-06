package com.rental.billing.client;

import com.rental.billing.client.dto.ContractDto;
import com.rental.billing.dto.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "contract-service")
public interface ContractClient {

    @GetMapping("/api/contracts/{id}")
    ApiResponse<ContractDto> getContractById(@PathVariable("id") Long id);

    @GetMapping("/api/contracts")
    ApiResponse<List<ContractDto>> getAllContracts();
}
