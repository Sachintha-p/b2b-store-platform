package com.example.e_commerce.dto;

import com.example.e_commerce.model.Coupon;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CouponSummaryDTO {
    private String code;
    private Coupon.DiscountType type;
    private BigDecimal discountValue;
    private LocalDateTime expiryDate;
}
