package com.example.e_commerce.controller;

import com.example.e_commerce.dto.OrderItemRequest;
import com.example.e_commerce.dto.OrderRequest;
import com.example.e_commerce.model.Order;
import com.example.e_commerce.model.Product;
import com.example.e_commerce.model.User;
import com.example.e_commerce.repository.CouponRepository;
import com.example.e_commerce.repository.OrderRepository;
import com.example.e_commerce.repository.ProductRepository;
import com.example.e_commerce.repository.UserRepository;
import com.example.e_commerce.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderControllerTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CouponRepository couponRepository;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private OrderController orderController;

    private Product mockProduct;

    @BeforeEach
    void setUp() {
        mockProduct = new Product();
        mockProduct.setId(1L);
        mockProduct.setName("Test Product");
        mockProduct.setRetailPrice(new BigDecimal("10.00"));
        mockProduct.setStockQuantity(100);
    }

    @Test
    void testCreateOrder_SavesAsPending_DoesNotDecrementStock() {
        OrderRequest req = new OrderRequest();
        req.setName("Test User");
        req.setEmail("test@test.com");
        
        OrderItemRequest itemReq = new OrderItemRequest();
        itemReq.setProductId(1L);
        itemReq.setQuantity(2);
        req.setItems(List.of(itemReq));

        when(productRepository.findById(1L)).thenReturn(Optional.of(mockProduct));
        when(request.getHeader("Authorization")).thenReturn(null); // No auth, retail

        Order savedOrder = new Order();
        savedOrder.setId(1L);
        savedOrder.setStatus(Order.OrderStatus.PENDING);
        
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        ResponseEntity<Order> response = orderController.createOrder(req, request);

        assertEquals(201, response.getStatusCode().value());
        assertEquals(Order.OrderStatus.PENDING, response.getBody().getStatus());
        
        // Assert stock is NOT decremented inside the controller (remains 100)
        assertEquals(100, mockProduct.getStockQuantity());
        
        // Assert we never called productRepository.save
        verify(productRepository, never()).save(any(Product.class));
    }

    @Test
    void testCreateOrder_AdminUser_FailsMOQ() {
        OrderRequest req = new OrderRequest();
        req.setName("Admin User");
        req.setEmail("admin@test.com");
        
        OrderItemRequest itemReq = new OrderItemRequest();
        itemReq.setProductId(1L);
        itemReq.setQuantity(4); // Less than 5 (MOQ)
        req.setItems(List.of(itemReq));

        when(request.getHeader("Authorization")).thenReturn("Bearer mock-token");
        when(jwtUtil.validateToken("mock-token")).thenReturn(true);
        when(jwtUtil.extractUserId("mock-token")).thenReturn(2L);
        
        User adminUser = new User();
        adminUser.setId(2L);
        adminUser.setRole(User.Role.ADMIN);
        when(userRepository.findById(2L)).thenReturn(Optional.of(adminUser));
        
        when(productRepository.findById(1L)).thenReturn(Optional.of(mockProduct));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class, () -> {
            orderController.createOrder(req, request);
        });

        assertEquals(400, exception.getStatusCode().value());
        assertTrue(exception.getReason().contains("minimum of 5 items"));
        
        // Ensure order is not saved
        verify(orderRepository, never()).save(any(Order.class));
    }
}
