package com.rental.notification.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${rental.rabbitmq.exchange:rental.topic.exchange}")
    private String exchangeName;

    @Value("${rental.rabbitmq.queues.contract:notification.contract.queue}")
    private String contractQueueName;

    @Value("${rental.rabbitmq.queues.invoice:notification.invoice.queue}")
    private String invoiceQueueName;

    @Value("${rental.rabbitmq.queues.payment:notification.payment.queue}")
    private String paymentQueueName;

    @Value("${rental.rabbitmq.queues.maintenance:notification.maintenance.queue}")
    private String maintenanceQueueName;

    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue contractQueue() {
        return QueueBuilder.durable(contractQueueName).build();
    }

    @Bean
    public Queue invoiceQueue() {
        return QueueBuilder.durable(invoiceQueueName).build();
    }

    @Bean
    public Queue paymentQueue() {
        return QueueBuilder.durable(paymentQueueName).build();
    }

    @Bean
    public Queue maintenanceQueue() {
        return QueueBuilder.durable(maintenanceQueueName).build();
    }

    @Bean
    public Binding bindingContractCreated(Queue contractQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(contractQueue).to(topicExchange).with("contract.created");
    }

    @Bean
    public Binding bindingContractTerminated(Queue contractQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(contractQueue).to(topicExchange).with("contract.terminated");
    }

    @Bean
    public Binding bindingInvoiceCreated(Queue invoiceQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(invoiceQueue).to(topicExchange).with("invoice.created");
    }

    @Bean
    public Binding bindingPaymentCompleted(Queue paymentQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(paymentQueue).to(topicExchange).with("payment.completed");
    }

    @Bean
    public Binding bindingMaintenanceCreated(Queue maintenanceQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(maintenanceQueue).to(topicExchange).with("maintenance.created");
    }

    @Bean
    public Binding bindingMaintenanceCompleted(Queue maintenanceQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(maintenanceQueue).to(topicExchange).with("maintenance.completed");
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter messageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter);
        return factory;
    }
}
