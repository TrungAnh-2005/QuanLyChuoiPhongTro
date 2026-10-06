package com.rental.billing.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "rental.topic.exchange";
    public static final String QUEUE_BILLING_PAYMENT = "billing.payment.queue";
    public static final String ROUTING_KEY_PAYMENT_COMPLETED = "payment.completed";
    public static final String ROUTING_KEY_INVOICE_CREATED = "invoice.created";

    @Bean
    public TopicExchange rentalTopicExchange() {
        return new TopicExchange(EXCHANGE_NAME, true, false);
    }

    @Bean
    public Queue billingPaymentQueue() {
        return new Queue(QUEUE_BILLING_PAYMENT, true);
    }

    @Bean
    public Binding billingPaymentBinding(Queue billingPaymentQueue, TopicExchange rentalTopicExchange) {
        return BindingBuilder.bind(billingPaymentQueue).to(rentalTopicExchange).with(ROUTING_KEY_PAYMENT_COMPLETED);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
