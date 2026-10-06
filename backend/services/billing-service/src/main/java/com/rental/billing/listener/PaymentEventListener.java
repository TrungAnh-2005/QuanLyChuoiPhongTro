package com.rental.billing.listener;

import com.rental.billing.config.RabbitMQConfig;
import com.rental.billing.dto.event.PaymentEventDTO;
import com.rental.billing.entity.Invoice;
import com.rental.billing.entity.InvoiceStatus;
import com.rental.billing.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventListener {

    private final InvoiceRepository invoiceRepository;

    @Transactional
    @RabbitListener(queues = RabbitMQConfig.QUEUE_BILLING_PAYMENT)
    public void handlePaymentCompleted(PaymentEventDTO event) {
        log.info("[RABBITMQ] Received payment.completed event for invoice ID: {}, amount: {}",
                event.getInvoiceId(), event.getAmount());

        invoiceRepository.findById(event.getInvoiceId()).ifPresent(invoice -> {
            if (event.getAmount() != null && event.getAmount().compareTo(invoice.getTotalAmount()) >= 0) {
                invoice.setStatus(InvoiceStatus.PAID);
            } else {
                invoice.setStatus(InvoiceStatus.PARTIAL);
            }
            invoiceRepository.save(invoice);
            log.info("[RABBITMQ] Updated invoice ID: {} to status: {}", invoice.getId(), invoice.getStatus());
        });
    }
}
