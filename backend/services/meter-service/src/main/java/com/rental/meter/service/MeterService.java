package com.rental.meter.service;

import com.rental.meter.dto.*;
import com.rental.meter.entity.MeterType;

import java.util.List;

public interface MeterService {
    List<MeterReadingResponse> getAllReadings();
    MeterReadingResponse recordReading(RecordMeterReadingRequest request);
    MeterReadingResponse getLatestReading(Long roomId, MeterType meterType);
    List<MeterReadingResponse> getReadingsByRoom(Long roomId);
}
