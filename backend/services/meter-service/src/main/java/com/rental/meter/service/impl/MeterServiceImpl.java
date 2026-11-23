package com.rental.meter.service.impl;

import com.rental.meter.dto.*;
import com.rental.meter.entity.Meter;
import com.rental.meter.entity.MeterReading;
import com.rental.meter.entity.MeterType;
import com.rental.meter.exception.AppException;
import com.rental.meter.repository.MeterReadingRepository;
import com.rental.meter.repository.MeterRepository;
import com.rental.meter.service.MeterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MeterServiceImpl implements MeterService {

    private final MeterRepository meterRepository;
    private final MeterReadingRepository readingRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MeterReadingResponse> getAllReadings() {
        return readingRepository.findAll().stream()
                .sorted((a, b) -> {
                    int dateCmp = b.getReadingDate().compareTo(a.getReadingDate());
                    return dateCmp != 0 ? dateCmp : Long.compare(b.getId(), a.getId());
                })
                .map(this::mapToReadingResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MeterReadingResponse recordReading(RecordMeterReadingRequest request) {
        Meter meter = meterRepository.findByRoomIdAndMeterType(request.getRoomId(), request.getMeterType())
                .orElseGet(() -> meterRepository.save(Meter.builder()
                        .roomId(request.getRoomId())
                        .meterType(request.getMeterType())
                        .build()));

        Optional<MeterReading> latestReadingOpt = readingRepository.findFirstByRoomIdAndMeterTypeOrderByReadingDateDesc(
                request.getRoomId(), request.getMeterType()
        );

        LocalDate targetDate=request.getReadingDate()!=null?request.getReadingDate():LocalDate.now();
        var history=readingRepository.findByRoomIdOrderByReadingDateDesc(request.getRoomId()).stream().filter(r -> r.getMeterType()==request.getMeterType()).toList();
        var current=history.stream().filter(r -> java.time.YearMonth.from(r.getReadingDate()).equals(java.time.YearMonth.from(targetDate))).findFirst();
        double oldReading=current.map(MeterReading::getOldReading).orElseGet(() -> history.stream().filter(r -> r.getReadingDate().isBefore(targetDate.withDayOfMonth(1))).findFirst().map(MeterReading::getNewReading).orElse(0.0));
        double newReading = request.getNewReading();

        if (newReading < oldReading) {
            throw new AppException("New reading (" + newReading + ") must be greater than or equal to old reading (" + oldReading + ")",
                    HttpStatus.BAD_REQUEST, "INVALID_METER_READING");
        }

        double usageAmount = BigDecimal.valueOf(newReading - oldReading)
                .setScale(2, RoundingMode.HALF_UP)
                .doubleValue();

        BigDecimal fee = BigDecimal.valueOf(usageAmount)
                .multiply(request.getUnitPrice())
                .setScale(2, RoundingMode.HALF_UP);

        LocalDate readingDate = request.getReadingDate() != null ? request.getReadingDate() : LocalDate.now();

        MeterReading reading = MeterReading.builder()
                .id(current.map(MeterReading::getId).orElse(null))
                .createdAt(current.map(MeterReading::getCreatedAt).orElse(null))
                .meterId(meter.getId())
                .roomId(request.getRoomId())
                .meterType(request.getMeterType())
                .oldReading(oldReading)
                .newReading(newReading)
                .readingDate(readingDate)
                .unitPrice(request.getUnitPrice())
                .usageAmount(usageAmount)
                .fee(fee)
                .build();

        MeterReading saved = readingRepository.save(reading);
        return mapToReadingResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MeterReadingResponse getLatestReading(Long roomId, MeterType meterType) {
        MeterReading reading = readingRepository.findFirstByRoomIdAndMeterTypeOrderByReadingDateDesc(roomId, meterType)
                .orElseThrow(() -> new AppException("No meter reading found for room " + roomId + " and type " + meterType,
                        HttpStatus.NOT_FOUND, "METER_READING_NOT_FOUND"));

        return mapToReadingResponse(reading);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MeterReadingResponse> getReadingsByRoom(Long roomId) {
        return readingRepository.findByRoomIdOrderByReadingDateDesc(roomId).stream()
                .map(this::mapToReadingResponse)
                .collect(Collectors.toList());
    }

    private MeterReadingResponse mapToReadingResponse(MeterReading reading) {
        return MeterReadingResponse.builder()
                .id(reading.getId())
                .meterId(reading.getMeterId())
                .roomId(reading.getRoomId())
                .meterType(reading.getMeterType())
                .oldReading(reading.getOldReading())
                .newReading(reading.getNewReading())
                .readingDate(reading.getReadingDate())
                .unitPrice(reading.getUnitPrice())
                .usageAmount(reading.getUsageAmount())
                .fee(reading.getFee())
                .createdAt(reading.getCreatedAt())
                .build();
    }
}
