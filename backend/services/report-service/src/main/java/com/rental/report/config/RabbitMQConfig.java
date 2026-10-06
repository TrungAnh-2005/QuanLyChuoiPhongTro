package com.rental.report.config;

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

    @Value("${rental.rabbitmq.queues.payment:report.payment.queue}")
    private String paymentQueueName;

    @Value("${rental.rabbitmq.queues.contract:report.contract.queue}")
    private String contractQueueName;

    @Bean
    public TopicExchange topicExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue reportPaymentQueue() {
        return QueueBuilder.durable(paymentQueueName).build();
    }

    @Bean
    public Queue reportContractQueue() {
        return QueueBuilder.durable(contractQueueName).build();
    }

    @Bean
    public Binding bindingReportPayment(Queue reportPaymentQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(reportPaymentQueue).to(topicExchange).with("payment.completed");
    }

    @Bean
    public Binding bindingReportContract(Queue reportContractQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(reportContractQueue).to(topicExchange).with("contract.created");
    }

    @Bean
    public Binding bindingReportContractTerminated(Queue reportContractQueue, TopicExchange topicExchange) {
        return BindingBuilder.bind(reportContractQueue).to(topicExchange).with("contract.terminated");
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
