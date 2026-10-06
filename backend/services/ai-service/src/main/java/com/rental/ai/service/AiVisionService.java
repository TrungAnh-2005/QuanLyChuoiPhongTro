package com.rental.ai.service;

import com.rental.ai.dto.IdCardOcrResponse;
import com.rental.ai.dto.MeterOcrResponse;
import org.springframework.web.multipart.MultipartFile;

public interface AiVisionService {

    IdCardOcrResponse extractIdCard(MultipartFile frontImage, MultipartFile backImage);

    MeterOcrResponse extractMeterReading(MultipartFile meterImage, String meterType);
}
