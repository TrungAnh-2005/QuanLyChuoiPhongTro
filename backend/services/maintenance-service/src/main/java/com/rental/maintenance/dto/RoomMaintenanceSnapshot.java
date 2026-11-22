package com.rental.maintenance.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RoomMaintenanceSnapshot(String status, Long maintenanceRequestId) { }
