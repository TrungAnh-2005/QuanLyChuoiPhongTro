package com.rental.meter.service;

import com.rental.meter.dto.*;
import com.rental.meter.entity.MeterType;

import java.util.List;

public interface MeterService {
    MeterResponse createMeter(CreateMeterRequest request);
    MeterReadingResponse recordReading(RecordMeterReadingRequest request);
    MeterReadingResponse getLatestReading(Long roomId, MeterType meterType);
    List<MeterReadingResponse> getReadingsByRoom(Long roomId);
    List<MeterResponse> getMetersByRoom(Long roomId);
    MeterSmartReadingResponse scanAndCalculateReading(MeterSmartReadingRequest request);
}
