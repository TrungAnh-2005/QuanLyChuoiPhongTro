package com.rental.report.client;

import com.rental.report.client.dto.ContractClientDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "contract-service")
public interface ContractClient {

    @GetMapping("/api/contracts")
    List<ContractClientDto> getAllContracts();
}
