package com.example.e_commerce.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product")
@Data
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Product name is mandatory")
    private String name;

    private String description;

    @NotNull(message = "Retail price is required")
    @PositiveOrZero(message = "Retail price must be zero or positive")
    private BigDecimal retailPrice;

    @NotNull(message = "Wholesale price is required")
    @PositiveOrZero(message = "Wholesale price must be zero or positive")
    private BigDecimal wholesalePrice;

    @NotNull(message = "Stock quantity is required")
    @PositiveOrZero(message = "Stock quantity must be zero or positive")
    private Integer stockQuantity;

    private String category;

    // Image support
    private String imageUrl;

    // Soft-delete: preserves order history integrity when a product is "deleted"
    private Boolean isArchived = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public boolean isArchived() {
        return isArchived != null && isArchived;
    }

    // Expose isActive for AdminStatsController (low stock counts active products)
    public boolean isActive() {
        return !isArchived();
    }
}
