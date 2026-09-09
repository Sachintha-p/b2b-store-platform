package com.example.e_commerce.controller;

import com.example.e_commerce.repository.OrderRepository;
import com.example.e_commerce.repository.ProductRepository;
import com.example.e_commerce.repository.UserRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/admin/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class AdminStatsController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<StatsResponse> getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalOrders = orderRepository.count();
        BigDecimal totalRevenue = orderRepository.sumRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }
        long lowStockProducts = productRepository.countByStockQuantityLessThanAndIsArchivedFalse(10);

        return ResponseEntity.ok(new StatsResponse(totalUsers, totalOrders, totalRevenue, lowStockProducts));
    }

    @Data
    public static class StatsResponse {
        private final long totalUsers;
        private final long totalOrders;
        private final BigDecimal totalRevenue;
        private final long lowStockProducts;

        public StatsResponse(long totalUsers, long totalOrders, BigDecimal totalRevenue, long lowStockProducts) {
            this.totalUsers = totalUsers;
            this.totalOrders = totalOrders;
            this.totalRevenue = totalRevenue;
            this.lowStockProducts = lowStockProducts;
        }
    }
}
