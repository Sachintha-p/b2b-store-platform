package com.example.e_commerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CouponValidateRequest {
    @NotBlank
    private String code;
    
    @NotNull
    @Positive
    private BigDecimal subtotal;
}
