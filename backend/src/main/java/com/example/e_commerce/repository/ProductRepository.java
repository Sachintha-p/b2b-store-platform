package com.example.e_commerce.repository;

import com.example.e_commerce.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query(value = "SELECT * FROM product p " +
            "WHERE (:query IS NULL OR :query = '' OR to_tsvector('english', p.name || ' ' || coalesce(p.description, '')) @@ to_tsquery('english', :query || ':*')) " +
            "AND (:category IS NULL OR :category = '' OR p.category = :category) " +
            "AND (:minPrice IS NULL OR p.retail_price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.retail_price <= :maxPrice)", 
            nativeQuery = true)
    List<Product> searchProducts(
            @Param("query") String query,
            @Param("category") String category,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice
    );

    List<Product> findByCategoryAndIdNot(String category, Long id);

    @Query("SELECT new com.example.e_commerce.dto.CategoryCountDTO(p.category, COUNT(p)) FROM Product p WHERE p.stockQuantity > 0 GROUP BY p.category")
    List<com.example.e_commerce.dto.CategoryCountDTO> getCategoryCounts();
}
