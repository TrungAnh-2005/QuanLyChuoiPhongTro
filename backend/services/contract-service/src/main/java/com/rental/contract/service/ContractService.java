package com.rental.contract.service;

import com.rental.contract.dto.ContractResponse;
import com.rental.contract.dto.CreateContractRequest;
import com.rental.contract.dto.RenewContractRequest;

import java.util.List;

public interface ContractService {
    ContractResponse createContract(CreateContractRequest request);
    ContractResponse terminateContract(Long id);
    ContractResponse renewContract(Long id, RenewContractRequest request);
    List<ContractResponse> getAllContracts();
    ContractResponse getContractById(Long id);
}
