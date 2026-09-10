package com.example.e_commerce.controller;

import com.example.e_commerce.dto.OrderItemRequest;
import com.example.e_commerce.dto.OrderRequest;
import com.example.e_commerce.model.Order;
import com.example.e_commerce.model.OrderItem;
import com.example.e_commerce.model.Product;
import com.example.e_commerce.repository.OrderRepository;
import com.example.e_commerce.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.example.e_commerce.repository.UserRepository;
import com.example.e_commerce.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

import com.example.e_commerce.model.Coupon;
import com.example.e_commerce.repository.CouponRepository;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final JwtUtil jwtUtil;
    private final com.example.e_commerce.service.NotificationService notificationService;

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }
    
    @GetMapping("/my-orders")
    public List<Order> getMyOrders(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return orderRepository.findAll().stream()
                .filter(o -> o.getUser() != null && o.getUser().getId().equals(userId))
                .toList();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long id, @RequestBody String status) {
        return orderRepository.findById(id).map(order -> {
            try {
                Order.OrderStatus newStatus = Order.OrderStatus.valueOf(status.replace("\"", "").trim().toUpperCase());
                order.setStatus(newStatus);
                Order updatedOrder = orderRepository.save(order);
                
                try {
                    notificationService.createOrderStatusNotification(updatedOrder);
                } catch (Exception ex) {
                    System.err.println("Failed to send notification: " + ex.getMessage());
                }
                
                return ResponseEntity.ok(updatedOrder);
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status");
            }
        }).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
                
        // Check ownership or admin role
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin && (order.getUser() == null || !order.getUser().getId().equals(userId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view this order");
        }
        
        return ResponseEntity.ok(order);
    }
    
    @PutMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
                
        // Check ownership or admin role
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin && (order.getUser() == null || !order.getUser().getId().equals(userId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to cancel this order");
        }
        
        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only PENDING orders can be cancelled. Current status: " + order.getStatus());
        }
        
        order.setStatus(Order.OrderStatus.CANCELLED);
        Order updatedOrder = orderRepository.save(order);
        
        try {
            notificationService.createOrderStatusNotification(updatedOrder);
        } catch (Exception ex) {
            System.err.println("Failed to send notification: " + ex.getMessage());
        }
        
        return ResponseEntity.ok(updatedOrder);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<Order> createOrder(@Valid @RequestBody OrderRequest orderRequest, HttpServletRequest request) {
        Order order = new Order();
        order.setCustomerName(orderRequest.getName());
        order.setCustomerEmail(orderRequest.getEmail());
        order.setShippingAddress(orderRequest.getShippingAddress());
        
        boolean isWholesaleUser = false;
        
        // Link to user if token is present
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.validateToken(token)) {
                Long userId = jwtUtil.extractUserId(token);
                userRepository.findById(userId).ifPresent(u -> {
                    order.setUser(u);
                });
            }
        }
        
        if (order.getUser() != null && order.getUser().getCustomerGroup() == com.example.e_commerce.model.User.CustomerGroup.WHOLESALE) {
            isWholesaleUser = true;
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        int totalQuantity = 0;

        for (OrderItemRequest itemReq : orderRequest.getItems()) {
            totalQuantity += itemReq.getQuantity();
            
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found with ID: " + itemReq.getProductId()));

            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock for product: " + product.getName());
            }

            // Price is derived strictly from the authenticated user's database CustomerGroup (WHOLESALE vs RETAIL)
            BigDecimal price = isWholesaleUser ? product.getWholesalePrice() : product.getRetailPrice();

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(itemReq.getQuantity());
            orderItem.setPriceAtPurchase(price);

            order.addItem(orderItem);
            
            BigDecimal itemTotal = price.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            subtotal = subtotal.add(itemTotal);
        }
        
        // Enforce Wholesale Minimum Order Quantity
        if (isWholesaleUser && totalQuantity < 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wholesale customers must order a minimum of 5 items total.");
        }
        
        // Handle Coupon
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (orderRequest.getCouponCode() != null && !orderRequest.getCouponCode().isBlank()) {
            Coupon coupon = couponRepository.findByCode(orderRequest.getCouponCode())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid coupon code"));
            
            if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon has expired");
            }
            if (coupon.getMinOrderValue() != null && subtotal.compareTo(coupon.getMinOrderValue()) < 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum order value for this coupon not met");
            }
            
            if (coupon.getType() == Coupon.DiscountType.FIXED) {
                discountAmount = coupon.getDiscountValue();
            } else if (coupon.getType() == Coupon.DiscountType.PERCENTAGE) {
                discountAmount = subtotal.multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
            }
            
            if (discountAmount.compareTo(subtotal) > 0) {
                discountAmount = subtotal;
            }
            
            order.setCouponCode(coupon.getCode());
            order.setDiscountAmount(discountAmount);
        }

        order.setTotalAmount(subtotal.subtract(discountAmount));
        
        Order savedOrder = orderRepository.save(order);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);
    }
}
