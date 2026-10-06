package com.rental.notification.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceEventDTO implements Serializable {
    private Long requestId;
    private Long roomId;
    private Long tenantId;
    private String title;
    private String priority;
    private String status;
    private BigDecimal cost;
    private LocalDateTime timestamp;
}
