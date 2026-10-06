package com.rental.contract.controller;

import com.rental.contract.dto.ApiResponse;
import com.rental.contract.dto.ContractResponse;
import com.rental.contract.dto.CreateContractRequest;
import com.rental.contract.dto.RenewContractRequest;
import com.rental.contract.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    @PostMapping
    public ResponseEntity<ApiResponse<ContractResponse>> createContract(@Valid @RequestBody CreateContractRequest request) {
        ContractResponse response = contractService.createContract(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Contract created successfully"));
    }

    @PostMapping("/{id}/terminate")
    public ResponseEntity<ApiResponse<ContractResponse>> terminateContract(@PathVariable Long id) {
        ContractResponse response = contractService.terminateContract(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Contract terminated successfully"));
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<ApiResponse<ContractResponse>> renewContract(
            @PathVariable Long id,
            @Valid @RequestBody RenewContractRequest request
    ) {
        ContractResponse response = contractService.renewContract(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Contract renewed successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ContractResponse>>> getAllContracts() {
        List<ContractResponse> response = contractService.getAllContracts();
        return ResponseEntity.ok(ApiResponse.success(response, "Get contracts successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContractResponse>> getContractById(@PathVariable Long id) {
        ContractResponse response = contractService.getContractById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Get contract detail successfully"));
    }
}
