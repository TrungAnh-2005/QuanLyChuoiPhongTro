package com.rental.maintenance.publisher;

import com.rental.maintenance.dto.event.MaintenanceEventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MaintenanceEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rental.rabbitmq.exchange:rental.topic.exchange}")
    private String exchange;

    @Value("${rental.rabbitmq.routing-key.maintenance-created:maintenance.created}")
    private String createdRoutingKey;

    @Value("${rental.rabbitmq.routing-key.maintenance-completed:maintenance.completed}")
    private String completedRoutingKey;

    public void publishMaintenanceCreated(MaintenanceEventDTO event) {
        log.info("Publishing maintenance created event for requestId: {}", event.getRequestId());
        rabbitTemplate.convertAndSend(exchange, createdRoutingKey, event);
    }

    public void publishMaintenanceCompleted(MaintenanceEventDTO event) {
        log.info("Publishing maintenance completed event for requestId: {}", event.getRequestId());
        rabbitTemplate.convertAndSend(exchange, completedRoutingKey, event);
    }
}
