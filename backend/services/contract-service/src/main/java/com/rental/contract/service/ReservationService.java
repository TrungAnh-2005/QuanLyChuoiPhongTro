package com.rental.contract.service;

import com.rental.contract.client.RoomClient;
import com.rental.contract.entity.DepositReceipt;
import com.rental.contract.entity.RoomRequest;
import com.rental.contract.repository.DepositReceiptRepository;
import com.rental.contract.repository.RoomRequestRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.function.Supplier;

@Service
@Slf4j
@RequiredArgsConstructor
public class ReservationService {
    private final RoomRequestRepository requests;
    private final DepositReceiptRepository receipts;
    private final RoomClient rooms;
    private final ContractService contracts;
    private final PlatformTransactionManager transactionManager;

    @Value("${contract.reservation.hold-hours:24}")
    private long holdHours = 24;

    public static String normalizeType(String type) {
        if (type == null) return null;
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "NEW_RENT", "RENTAL", "HOLD" -> "RENT";
            default -> normalized;
        };
    }

    public static boolean isRent(RoomRequest request) {
        return "RENT".equals(normalizeType(request.getType()));
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public RoomRequest reserve(RoomRequest request) {
        return outsideTransaction(() -> acquireReservation(request));
    }

    private RoomRequest acquireReservation(RoomRequest proposed) {
        if (!isRent(proposed) || proposed.getTenantId() == null || proposed.getTargetRoomId() == null) {
            throw badRequest("A rental request requires tenantId and targetRoomId");
        }
        // No contract DB transaction/connection is held while room-service calls back to GET contracts.
        var room = rooms.getRoomById(proposed.getTargetRoomId()).getData();
        RoomRequest intent;
        try {
            intent = durable(() -> prepareIntent(proposed, room == null ? null : room.getBasePrice()));
        } catch (DataIntegrityViolationException duplicate) {
            // Another concurrent POST may have committed the same tenant/room intent first.
            intent = durable(() -> requests.findReservationIdByKey(key(proposed))
                    .map(this::locked).orElseThrow(() -> duplicate));
        }
        if ("HOLDING".equals(intent.getStatus())) {
            ensureLive(intent);
            return intent;
        }
        if ("APPROVED".equals(intent.getStatus()) && intent.getContractId() != null) return intent;
        if (!"PENDING".equals(intent.getStatus()) || intent.getHoldExpiresAt() == null
                || !intent.getHoldExpiresAt().isAfter(Instant.now())) throw conflict("Reservation intent is no longer live");
        final RoomRequest pending = intent;
        try {
            var response = rooms.acquireHold(pending.getTargetRoomId(), new RoomClient.HoldRequest(
                    pending.getId(), pending.getTenantId(), pending.getHoldExpiresAt()));
            if (response == null || response.getData() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Room hold response was incomplete; retry the same reservation");
            }
        } catch (FeignException error) {
            if (error.status() >= 400 && error.status() < 500 && error.status() != 408 && error.status() != 429) {
                durable(() -> {
                    RoomRequest current = locked(pending.getId());
                    if ("PENDING".equals(current.getStatus())) {
                        current.setStatus("REJECTED");
                        current.setReservationKey(null);
                        current.setReviewedAt(LocalDateTime.now());
                        requests.save(current);
                    }
                    return current;
                });
            }
            // Timeout/5xx may have committed remotely: retain the durable PENDING identity for retry.
            throw remoteFailure(error);
        }
        RoomRequest finalized = durable(() -> {
            RoomRequest current = locked(pending.getId());
            if ("PENDING".equals(current.getStatus()) && current.getHoldExpiresAt().isAfter(Instant.now())) {
                current.setStatus("HOLDING");
                requests.save(current);
            }
            return current;
        });
        if (!"HOLDING".equals(finalized.getStatus()) && !"APPROVED".equals(finalized.getStatus())) {
            // Cancellation/expiry can win while the network call is in flight. Undo that late hold.
            release(finalized);
            throw conflict("Reservation was cancelled or expired while acquiring its hold");
        }
        return finalized;
    }

    private RoomRequest prepareIntent(RoomRequest proposed, BigDecimal price) {
        RoomRequest intent = proposed;
        if (proposed.getId() != null) {
            intent = locked(proposed.getId());
        } else {
            var existingId = requests.findReservationIdByKey(key(proposed));
            if (existingId.isEmpty()) {
                existingId = requests.findRecoverableReservationIds(proposed.getTenantId(), proposed.getTargetRoomId(), Instant.now())
                        .stream().findFirst();
            }
            if (existingId.isPresent()) intent = locked(existingId.get());
        }
        if ("HOLDING".equals(intent.getStatus()) || ("APPROVED".equals(intent.getStatus()) && intent.getContractId() != null)) return intent;
        if ("APPROVED".equals(intent.getStatus()) && intent.getHoldExpiresAt() == null) intent.setStatus("PENDING");
        if (!"PENDING".equals(intent.getStatus())) throw conflict("Request cannot acquire a reservation in its current state");
        if (intent.getHoldExpiresAt() != null) return intent; // Retries retain the original price, deadline and identity.
        int months = intent.getDurationMonths() == null ? 12 : intent.getDurationMonths();
        if (months < 1 || months > 120) throw badRequest("Invalid rental duration");
        if (price == null || price.signum() <= 0) throw badRequest("Room must have a positive rental price");
        intent.setType("RENT");
        intent.setContractId(null);
        intent.setDurationMonths(months);
        intent.setRequiredDepositAmount(price);
        intent.setRentalPriceSnapshot(price);
        intent.setPaidDepositAmount(BigDecimal.ZERO);
        intent.setHoldExpiresAt(Instant.now().plusSeconds(Math.max(1, holdHours) * 3600));
        intent.setReservationKey(key(intent));
        return requests.saveAndFlush(intent);
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public RoomRequest approveLegacy(Long id) {
        return outsideTransaction(() -> reserve(durable(() -> locked(id))));
    }

    @Transactional
    public RoomRequest confirmReceipt(Long id, BigDecimal amount, String receiptReference) {
        if (amount == null || amount.signum() <= 0 || amount.stripTrailingZeros().scale() > 2
                || amount.compareTo(new BigDecimal("9999999999999.99")) > 0) {
            throw badRequest("Receipt amount must be positive and have at most two decimal places");
        }
        if (receiptReference == null || receiptReference.isBlank() || receiptReference.trim().length() > 150) {
            throw badRequest("A receipt reference of at most 150 characters is required");
        }
        RoomRequest request = locked(id);
        String reference = receiptReference.trim();
        var previous = receipts.findByRequestIdAndReceiptReference(id, reference);
        if (previous.isPresent()) {
            if (previous.get().getAmount().compareTo(amount) != 0) throw conflict("Receipt reference already has a different amount");
            return request;
        }
        ensureLive(request, amount);
        BigDecimal total = request.getPaidDepositAmount().add(amount);
        if (total.compareTo(request.getRequiredDepositAmount()) > 0) throw conflict("Receipt exceeds the remaining deposit");

        receipts.saveAndFlush(DepositReceipt.builder().requestId(id).receiptReference(reference)
                .amount(amount).confirmedAt(LocalDateTime.now()).build());
        request.setPaidDepositAmount(total);
        if (total.compareTo(request.getRequiredDepositAmount()) == 0) {
            var contract = contracts.createReservedContract(request);
            request.setContractId(contract.getId());
            request.setStatus("APPROVED");
            request.setReservationKey(null);
            request.setReviewedAt(LocalDateTime.now());
        }
        return requests.save(request);
    }

    @Transactional
    public RoomRequest cancel(Long id) {
        RoomRequest request = locked(id);
        if (!isRent(request)) throw badRequest("Only rental reservations use this cancellation endpoint");
        if ("CANCELLED".equals(request.getStatus()) || "EXPIRED".equals(request.getStatus())) return request;
        if (!"HOLDING".equals(request.getStatus()) && !"PENDING".equals(request.getStatus())) {
            throw conflict("An active rental contract cannot be cancelled as a reservation");
        }
        if (request.getHoldExpiresAt() != null) release(request);
        request.setStatus("CANCELLED");
        request.setReservationKey(null);
        request.setReviewedAt(LocalDateTime.now());
        return requests.save(request);
    }

    @Transactional
    public void expireHolds() {
        for (Long id : requests.findExpiredReservationIds(Instant.now())) {
            RoomRequest request = locked(id);
            if (!("HOLDING".equals(request.getStatus()) || "PENDING".equals(request.getStatus()))
                    || request.getHoldExpiresAt() == null || request.getHoldExpiresAt().isAfter(Instant.now())) continue;
            try {
                release(request);
            } catch (ResponseStatusException | FeignException error) {
                log.warn("Could not release expired reservation {}; retaining it for reconciliation/retry", id, error);
                continue;
            }
            request.setStatus("EXPIRED");
            request.setReservationKey(null);
            request.setReviewedAt(LocalDateTime.now());
            requests.save(request);
        }
    }

    @Transactional(readOnly = true)
    public List<DepositReceipt> receipts(Long id) {
        if (!requests.existsById(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found");
        return receipts.findByRequestIdOrderByIdAsc(id);
    }

    private RoomRequest locked(Long id) {
        return requests.findForReservation(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
    }

    private void ensureLive(RoomRequest request) {
        ensureLive(request, null);
    }

    private void ensureLive(RoomRequest request, BigDecimal receiptAmount) {
        if (!isRent(request) || !"HOLDING".equals(request.getStatus()) || request.getHoldExpiresAt() == null
                || request.getRequiredDepositAmount() == null
                || request.getPaidDepositAmount() == null) {
            throw conflict("Reservation is no longer accepting deposit receipts");
        }
        if (!request.getHoldExpiresAt().isAfter(Instant.now())) {
            // Remote confirmation may have succeeded immediately before the local transaction rolled back.
            // Reconcile only that already occupied, same-token room and only against the full deposit.
            if (receiptAmount == null || request.getPaidDepositAmount().add(receiptAmount)
                    .compareTo(request.getRequiredDepositAmount()) != 0) throw conflict("Reservation has expired");
            var room = rooms.getRoomById(request.getTargetRoomId()).getData();
            if (room == null || !"OCCUPIED".equals(room.getStatus())
                    || !java.util.Objects.equals(room.getHoldRequestId(), request.getId())) {
                throw conflict("Reservation has expired");
            }
        }
    }

    private void release(RoomRequest request) {
        try {
            rooms.releaseHold(request.getTargetRoomId(), request.getId());
        } catch (FeignException error) {
            // A previously expired hold can already have been replaced by another reservation.
            // Never modify that new owner's room or discard this request's payment history.
            if (error.status() != 409 || request.getHoldExpiresAt() == null
                    || request.getHoldExpiresAt().isAfter(Instant.now())) throw remoteFailure(error);
            var currentRoom = rooms.getRoomById(request.getTargetRoomId()).getData();
            if (currentRoom == null || java.util.Objects.equals(currentRoom.getHoldRequestId(), request.getId())) {
                throw remoteFailure(error);
            }
        }
    }

    private static String key(RoomRequest request) {
        return request.getTenantId() + ":" + request.getTargetRoomId();
    }

    private <T> T durable(Supplier<T> work) {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return transaction.execute(status -> work.get());
    }

    private <T> T outsideTransaction(Supplier<T> work) {
        TransactionTemplate transaction = new TransactionTemplate(transactionManager);
        transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_NOT_SUPPORTED);
        return transaction.execute(status -> work.get());
    }

    private static ResponseStatusException remoteFailure(FeignException error) {
        return new ResponseStatusException(error.status() == 409 ? HttpStatus.CONFLICT : HttpStatus.BAD_GATEWAY,
                error.status() == 409 ? "Room reservation conflicts with its current state" : "Room service could not complete the reservation", error);
    }

    private static ResponseStatusException badRequest(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    private static ResponseStatusException conflict(String message) { return new ResponseStatusException(HttpStatus.CONFLICT, message); }
}
