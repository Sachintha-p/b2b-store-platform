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

    @jakarta.persistence.Column(columnDefinition = "TEXT")
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
    private String imagePublicId;

    @jakarta.persistence.OneToMany(mappedBy = "product", cascade = jakarta.persistence.CascadeType.ALL, orphanRemoval = true)
    @jakarta.persistence.OrderBy("displayOrder ASC")
    private java.util.List<ProductImage> additionalImages = new java.util.ArrayList<>();


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

    @com.fasterxml.jackson.annotation.JsonProperty("images")
    public java.util.List<String> getImages() {
        java.util.List<String> list = new java.util.ArrayList<>();
        if (imageUrl != null && !imageUrl.isBlank()) {
            list.add(imageUrl);
        }
        if (additionalImages != null) {
            for (ProductImage img : additionalImages) {
                if (img.getImageUrl() != null && !img.getImageUrl().isBlank()) {
                    list.add(img.getImageUrl());
                }
            }
        }
        return list;
    }
}
