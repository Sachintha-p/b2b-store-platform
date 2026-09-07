package com.example.e_commerce.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class OrderItemRequest {
    
    @NotNull(message = "Product ID is mandatory")
    private Long productId;
    
    @NotNull(message = "Quantity is mandatory")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;
    
    private boolean isB2B; // True if wholesale pricing should be applied
}
