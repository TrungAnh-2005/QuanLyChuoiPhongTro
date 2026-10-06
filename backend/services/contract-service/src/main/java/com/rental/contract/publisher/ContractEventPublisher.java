package com.rental.contract.publisher;

import com.rental.contract.config.RabbitMQConfig;
import com.rental.contract.dto.event.ContractEventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ContractEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishContractCreated(ContractEventDTO event) {
        log.info("[RABBITMQ] Publishing contract.created event for contract: {}", event.getContractId());
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY_CONTRACT_CREATED, event);
    }

    public void publishContractTerminated(ContractEventDTO event) {
        log.info("[RABBITMQ] Publishing contract.terminated event for contract: {}", event.getContractId());
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY_CONTRACT_TERMINATED, event);
    }
}
