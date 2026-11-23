package com.rental.maintenance.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RoomLookupResponse(Boolean success, RoomMaintenanceSnapshot data) { }
