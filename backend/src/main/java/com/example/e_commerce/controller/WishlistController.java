package com.example.e_commerce.controller;

import com.example.e_commerce.model.Product;
import com.example.e_commerce.model.User;
import com.example.e_commerce.model.WishlistItem;
import com.example.e_commerce.repository.ProductRepository;
import com.example.e_commerce.repository.UserRepository;
import com.example.e_commerce.repository.WishlistRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users/me/wishlist")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class WishlistController {

    private final WishlistRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @GetMapping
    public ResponseEntity<List<Product>> getWishlist(HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        List<WishlistItem> items = wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId());

        List<Product> products = items.stream()
                .map(WishlistItem::getProduct)
                .filter(p -> p != null && !p.isArchived())
                .peek(p -> p.setIsWishlisted(true))
                .toList();

        return ResponseEntity.ok(products);
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getWishlistCount(HttpServletRequest request) {
        User user = getAuthenticatedUser(request);
        long count = wishlistRepository.countByUserId(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/{productId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> addToWishlist(
            @PathVariable Long productId,
            HttpServletRequest request) {

        User user = getAuthenticatedUser(request);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (product.isArchived()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot wishlist archived products");
        }

        Optional<WishlistItem> existingOpt = wishlistRepository.findByUserIdAndProductId(user.getId(), productId);
        if (existingOpt.isEmpty()) {
            WishlistItem item = new WishlistItem();
            item.setUser(user);
            item.setProduct(product);
            wishlistRepository.save(item);
        }

        // Idempotent 200 OK
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Product added to wishlist",
                "productId", productId
        ));
    }

    @DeleteMapping("/{productId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> removeFromWishlist(
            @PathVariable Long productId,
            HttpServletRequest request) {

        User user = getAuthenticatedUser(request);
        
        // Idempotent removal — even if not present, don't error
        wishlistRepository.deleteByUserIdAndProductId(user.getId(), productId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Product removed from wishlist",
                "productId", productId
        ));
    }
}
