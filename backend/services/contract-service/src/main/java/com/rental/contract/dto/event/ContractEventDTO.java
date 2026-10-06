package com.rental.contract.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractEventDTO implements Serializable {
    private Long contractId;
    private Long tenantId;
    private Long roomId;
    private String status;
    private BigDecimal rentalPrice;
}
