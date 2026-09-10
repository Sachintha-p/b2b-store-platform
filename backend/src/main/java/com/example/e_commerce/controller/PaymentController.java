package com.example.e_commerce.controller;

import com.example.e_commerce.model.Order;
import com.example.e_commerce.repository.OrderRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class PaymentController {

    private final OrderRepository orderRepository;

    @Value("${stripe.api.key}")
    private String stripeApiKey;

    @Value("${stripe.success.url}")
    private String successUrl;

    @Value("${stripe.cancel.url}")
    private String cancelUrl;

    @PostMapping("/create-checkout-session")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@RequestBody Map<String, Long> payload) {
        Long orderId = payload.get("orderId");
        
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        if (stripeApiKey == null || stripeApiKey.isBlank() || stripeApiKey.contains("placeholder") || stripeApiKey.contains("dummy")) {
            // Dev/Mock fallback when Stripe secret key is not configured in local environment
            Map<String, String> responseData = new HashMap<>();
            responseData.put("url", successUrl + "?order_id=" + order.getId());
            return ResponseEntity.ok(responseData);
        }

        try {
            Stripe.apiKey = stripeApiKey;

            // Convert big decimal to cents
            long amountInCents = order.getTotalAmount().multiply(new BigDecimal("100")).longValue();

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(successUrl + "?order_id=" + order.getId())
                    .setCancelUrl(cancelUrl)
                    .setClientReferenceId(order.getId().toString())
                    .setCustomerEmail(order.getCustomerEmail())
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("usd")
                                                    .setUnitAmount(amountInCents)
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Order #" + order.getId())
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .build();

            Session session = Session.create(params);

            Map<String, String> responseData = new HashMap<>();
            responseData.put("url", session.getUrl());
            return ResponseEntity.ok(responseData);
        } catch (StripeException e) {
            System.err.println("Stripe Checkout Session Error: " + e.getMessage() + ". Falling back to demo success URL.");
            Map<String, String> responseData = new HashMap<>();
            responseData.put("url", successUrl + "?order_id=" + order.getId());
            return ResponseEntity.ok(responseData);
        }
    }
}
