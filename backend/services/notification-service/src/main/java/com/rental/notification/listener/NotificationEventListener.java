package com.rental.notification.listener;

import com.rental.notification.dto.event.ContractEventDTO;
import com.rental.notification.dto.event.InvoiceEventDTO;
import com.rental.notification.dto.event.MaintenanceEventDTO;
import com.rental.notification.dto.event.PaymentEventDTO;
import com.rental.notification.entity.NotificationType;
import com.rental.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;

    @RabbitListener(queues = "${rental.rabbitmq.queues.contract:notification.contract.queue}")
    public void handleContractEvent(ContractEventDTO event) {
        log.info("Received contract event for contractNumber: {}, status: {}", event.getContractNumber(), event.getStatus());
        NotificationType type = "TERMINATED".equalsIgnoreCase(event.getStatus()) 
                ? NotificationType.CONTRACT_TERMINATED 
                : NotificationType.CONTRACT_CREATED;
        
        String title = type == NotificationType.CONTRACT_CREATED ? "Hợp Đồng Mới Được Tạo" : "Hợp Đồng Đã Chấm Dứt";
        String content = "Hợp đồng " + event.getContractNumber() + " cho phòng " + event.getRoomId() 
                + (type == NotificationType.CONTRACT_CREATED ? " đã được kích hoạt thành công." : " đã chấm dứt hiệu lực.");

        notificationService.saveSystemNotification(event.getTenantId(), null, null, title, content, type);
    }

    @RabbitListener(queues = "${rental.rabbitmq.queues.invoice:notification.invoice.queue}")
    public void handleInvoiceEvent(InvoiceEventDTO event) {
        log.info("Received invoice event for invoiceNumber: {}, amount: {}", event.getInvoiceNumber(), event.getTotalAmount());
        String title = "Hóa Đơn Tiền Phòng Mới";
        String content = "Hóa đơn " + event.getInvoiceNumber() + " tháng " + event.getMonth() + "/" + event.getYear() 
                + " đã được phát hành. Tổng tiền: " + event.getTotalAmount() + " VNĐ. Hạn đóng: " + event.getDueDate();

        notificationService.saveSystemNotification(event.getTenantId(), null, null, title, content, NotificationType.INVOICE_CREATED);
    }

    @RabbitListener(queues = "${rental.rabbitmq.queues.payment:notification.payment.queue}")
    public void handlePaymentEvent(PaymentEventDTO event) {
        log.info("Received payment event for paymentId: {}, invoiceId: {}", event.getPaymentId(), event.getInvoiceId());
        String title = "Thanh Toán Thành Công";
        String content = "Khoản thanh toán " + event.getAmount() + " VNĐ cho hóa đơn #" + event.getInvoiceId() 
                + " qua " + event.getPaymentMethod() + " đã được ghi nhận thành công.";

        notificationService.saveSystemNotification(null, null, null, title, content, NotificationType.PAYMENT_COMPLETED);
    }

    @RabbitListener(queues = "${rental.rabbitmq.queues.maintenance:notification.maintenance.queue}")
    public void handleMaintenanceEvent(MaintenanceEventDTO event) {
        log.info("Received maintenance event for requestId: {}, status: {}", event.getRequestId(), event.getStatus());
        NotificationType type = "COMPLETED".equalsIgnoreCase(event.getStatus())
                ? NotificationType.MAINTENANCE_COMPLETED
                : NotificationType.MAINTENANCE_CREATED;

        String title = type == NotificationType.MAINTENANCE_COMPLETED ? "Yêu Cầu Sửa Chữa Đã Hoàn Thành" : "Yêu Cầu Sửa Chữa Mới";
        String content = "Yêu cầu: " + event.getTitle() + " cho phòng " + event.getRoomId() 
                + (type == NotificationType.MAINTENANCE_COMPLETED ? " đã xử lý xong." : " đã được tiếp nhận.");

        notificationService.saveSystemNotification(event.getTenantId(), null, null, title, content, type);
    }
}
