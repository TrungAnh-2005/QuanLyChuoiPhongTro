package com.rental.billing.publisher;

import com.rental.billing.config.RabbitMQConfig;
import com.rental.billing.dto.event.InvoiceEventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InvoiceEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishInvoiceCreated(InvoiceEventDTO event) {
        log.info("[RABBITMQ] Publishing invoice.created event for invoice: {}", event.getInvoiceId());
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY_INVOICE_CREATED, event);
    }
}
