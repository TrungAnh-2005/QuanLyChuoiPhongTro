package com.rental.payment.publisher;

import com.rental.payment.dto.event.PaymentEventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rental.rabbitmq.exchange:rental.topic.exchange}")
    private String exchange;

    @Value("${rental.rabbitmq.routing-key.payment-completed:payment.completed}")
    private String paymentCompletedRoutingKey;

    public void publishPaymentCompleted(PaymentEventDTO event) {
        log.info("Publishing payment completed event for paymentId: {}, invoiceId: {}", event.getPaymentId(), event.getInvoiceId());
        rabbitTemplate.convertAndSend(exchange, paymentCompletedRoutingKey, event);
    }
}
