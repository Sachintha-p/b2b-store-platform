package com.example.e_commerce.controller;

import com.example.e_commerce.model.Order;
import com.example.e_commerce.model.OrderItem;
import com.example.e_commerce.model.Product;
import com.example.e_commerce.repository.OrderRepository;
import com.example.e_commerce.repository.ProductRepository;
import com.example.e_commerce.service.EmailService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;
    private final com.example.e_commerce.service.NotificationService notificationService;

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    @PostMapping("/stripe")
    @Transactional
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;

        try {
            // For testing, if secret is placeholder, we skip verification
            if (endpointSecret.startsWith("whsec_placeholder")) {
                event = com.stripe.model.Event.GSON.fromJson(payload, com.stripe.model.Event.class);
            } else {
                event = Webhook.constructEvent(payload, sigHeader, endpointSecret);
            }
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Signature Verification Failed");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid payload");
        }

        if ("checkout.session.completed".equals(event.getType())) {
            Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
            
            if (session != null && session.getClientReferenceId() != null) {
                Long orderId = Long.parseLong(session.getClientReferenceId());
                
                Order order = orderRepository.findById(orderId).orElse(null);
                
                if (order != null && order.getStatus() == Order.OrderStatus.PENDING) {
                    // Check stock concurrency
                    boolean hasStock = true;
                    for (OrderItem item : order.getItems()) {
                        Product product = productRepository.findById(item.getProduct().getId()).orElse(null);
                        if (product == null || product.getStockQuantity() < item.getQuantity()) {
                            hasStock = false;
                            break;
                        }
                    }

                    if (hasStock) {
                        // Deduct stock and finalize
                        for (OrderItem item : order.getItems()) {
                            Product product = productRepository.findById(item.getProduct().getId()).get();
                            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
                            productRepository.save(product);
                        }
                        
                        order.setStatus(Order.OrderStatus.PAID);
                        orderRepository.save(order);
                        
                        try {
                            notificationService.createOrderStatusNotification(order);
                        } catch (Exception ex) {
                            System.err.println("Failed to send notification: " + ex.getMessage());
                        }
                        
                        // Fire Email!
                        emailService.sendOrderConfirmation(order);
                    } else {
                        // Concurrent user bought it!
                        order.setStatus(Order.OrderStatus.CANCELLED);
                        // In reality, we would trigger a refund here.
                        orderRepository.save(order);
                        
                        try {
                            notificationService.createOrderStatusNotification(order);
                        } catch (Exception ex) {
                            System.err.println("Failed to send notification: " + ex.getMessage());
                        }
                    }
                }
            }
        }

        return ResponseEntity.ok("Success");
    }
}
