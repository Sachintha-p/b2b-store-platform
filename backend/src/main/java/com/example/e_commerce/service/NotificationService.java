package com.example.e_commerce.service;

import com.example.e_commerce.model.Notification;
import com.example.e_commerce.model.Order;
import com.example.e_commerce.model.User;
import com.example.e_commerce.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    public void createOrderStatusNotification(Order order) {
        if (order.getUser() == null) {
            return;
        }

        User user = order.getUser();
        
        // 5. Confirm explicitly, at each of the 4 hook points, that notification creation checks user.isNotifyOrderUpdates()
        // Here is the centralized check that applies to all hook points.
        if (!user.isNotifyOrderUpdates()) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(Notification.NotificationType.ORDER_STATUS);
        notification.setRelatedOrderId(order.getId());
        
        String statusStr = order.getStatus().name();
        notification.setTitle("Order Update: " + statusStr);
        notification.setMessage("Your order #" + order.getId() + " status is now " + statusStr + ".");
        
        notificationRepository.save(notification);
    }
}
