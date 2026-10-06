package com.rental.report.listener;

import com.rental.report.dto.event.ContractEventDTO;
import com.rental.report.dto.event.PaymentEventDTO;
import com.rental.report.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReportEventListener {

    private final ReportService reportService;

    @RabbitListener(queues = "${rental.rabbitmq.queues.payment:report.payment.queue}")
    public void handlePaymentCompleted(PaymentEventDTO event) {
        log.info("Report service received payment completed event: paymentId: {}, amount: {}", event.getPaymentId(), event.getAmount());
        reportService.processPaymentCompleted(event);
    }

    @RabbitListener(queues = "${rental.rabbitmq.queues.contract:report.contract.queue}")
    public void handleContractEvent(ContractEventDTO event) {
        log.info("Report service received contract event: contractId: {}, number: {}, status: {}", event.getContractId(), event.getContractNumber(), event.getStatus());
        reportService.processContractEvent(event);
    }
}
