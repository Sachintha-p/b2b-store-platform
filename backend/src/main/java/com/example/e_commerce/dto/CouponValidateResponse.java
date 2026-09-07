package com.example.e_commerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class CouponValidateResponse {
    private boolean valid;
    private String message;
    private BigDecimal discountAmount;
}
