package com.example.e_commerce.service;

import com.example.e_commerce.model.Order;
import com.example.e_commerce.model.OrderItem;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendOrderConfirmation(Order order) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(order.getCustomerEmail());
            helper.setSubject("Order Confirmation - #" + order.getId());
            
            StringBuilder htmlBody = new StringBuilder();
            htmlBody.append("<h2>Thank you for your order!</h2>");
            htmlBody.append("<p>Hi ").append(order.getCustomerName()).append(",</p>");
            htmlBody.append("<p>We have successfully received your payment for Order #").append(order.getId()).append(".</p>");
            htmlBody.append("<h3>Order Summary:</h3>");
            htmlBody.append("<ul>");
            
            for (OrderItem item : order.getItems()) {
                htmlBody.append("<li>")
                        .append(item.getQuantity()).append("x ")
                        .append(item.getProduct().getName())
                        .append(" - $").append(item.getPriceAtPurchase())
                        .append("</li>");
            }
            
            htmlBody.append("</ul>");
            
            if (order.getDiscountAmount() != null && order.getDiscountAmount().signum() > 0) {
                htmlBody.append("<p><strong>Discount (").append(order.getCouponCode()).append("):</strong> -$").append(order.getDiscountAmount()).append("</p>");
            }
            
            htmlBody.append("<h3><strong>Total Paid: $").append(order.getTotalAmount()).append("</strong></h3>");
            htmlBody.append("<p><strong>Shipping Address:</strong><br>").append(order.getShippingAddress().replace("\n", "<br>")).append("</p>");
            htmlBody.append("<p>Thank you for shopping with us!</p>");
            
            helper.setText(htmlBody.toString(), true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send email to " + order.getCustomerEmail() + ": " + e.getMessage());
        }
    }
}
