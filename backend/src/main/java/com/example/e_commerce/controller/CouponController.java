package com.example.e_commerce.controller;

import com.example.e_commerce.dto.CouponValidateRequest;
import com.example.e_commerce.dto.CouponValidateResponse;
import com.example.e_commerce.model.Coupon;
import com.example.e_commerce.repository.CouponRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class CouponController {

    private final CouponRepository couponRepository;

    @GetMapping
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Coupon> createCoupon(@Valid @RequestBody Coupon coupon) {
        if (couponRepository.findByCode(coupon.getCode()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coupon code already exists");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(couponRepository.save(coupon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCoupon(@PathVariable Long id) {
        if (!couponRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Coupon not found");
        }
        couponRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/validate")
    public ResponseEntity<CouponValidateResponse> validateCoupon(@Valid @RequestBody CouponValidateRequest request) {
        Coupon coupon = couponRepository.findByCode(request.getCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid coupon code"));

        if (coupon.getExpiryDate() != null && coupon.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.ok(new CouponValidateResponse(false, "Coupon has expired", BigDecimal.ZERO));
        }

        if (coupon.getMinOrderValue() != null && request.getSubtotal().compareTo(coupon.getMinOrderValue()) < 0) {
            return ResponseEntity.ok(new CouponValidateResponse(false, "Minimum order value not met ($" + coupon.getMinOrderValue() + ")", BigDecimal.ZERO));
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        if (coupon.getType() == Coupon.DiscountType.FIXED) {
            discountAmount = coupon.getDiscountValue();
        } else if (coupon.getType() == Coupon.DiscountType.PERCENTAGE) {
            discountAmount = request.getSubtotal().multiply(coupon.getDiscountValue()).divide(BigDecimal.valueOf(100));
        }
        
        // Ensure discount is not greater than subtotal
        if (discountAmount.compareTo(request.getSubtotal()) > 0) {
            discountAmount = request.getSubtotal();
        }

        return ResponseEntity.ok(new CouponValidateResponse(true, "Coupon applied successfully", discountAmount));
    }
}
