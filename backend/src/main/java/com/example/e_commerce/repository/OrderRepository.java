package com.example.e_commerce.repository;

import com.example.e_commerce.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status IN ('PAID', 'SHIPPED')")
    BigDecimal sumRevenue();
}
