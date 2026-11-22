package com.rental.contract.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationExpiryScheduler {
    private final ReservationService reservations;

    @Scheduled(fixedDelayString = "${contract.reservation.expiry-scan-ms:60000}")
    public void expire() {
        try {
            reservations.expireHolds();
        } catch (RuntimeException error) {
            log.warn("Could not reconcile expired reservations; the next scan will retry", error);
        }
    }
}
