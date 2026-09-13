package com.example.e_commerce.controller;

import com.example.e_commerce.dto.ReviewRequestDTO;
import com.example.e_commerce.dto.ReviewResponseDTO;
import com.example.e_commerce.dto.ReviewSummaryDTO;
import com.example.e_commerce.model.Product;
import com.example.e_commerce.model.Review;
import com.example.e_commerce.model.User;
import com.example.e_commerce.repository.ProductRepository;
import com.example.e_commerce.repository.ReviewRepository;
import com.example.e_commerce.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class ReviewController {

    private final ReviewRepository reviewRepository;
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

    private ReviewResponseDTO mapToDTO(Review review) {
        String name = review.getUser() != null ? review.getUser().getName() : "Anonymous";
        String group = (review.getUser() != null && review.getUser().getCustomerGroup() != null)
                ? review.getUser().getCustomerGroup().name()
                : "RETAIL";

        return new ReviewResponseDTO(
                review.getId(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                name,
                group
        );
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponseDTO>> getProductReviews(@PathVariable Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }

        List<ReviewResponseDTO> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId)
                .stream()
                .map(this::mapToDTO)
                .toList();

        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/summary")
    public ResponseEntity<ReviewSummaryDTO> getReviewSummary(@PathVariable Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }

        Double avg = reviewRepository.getAverageRatingByProductId(productId);
        long count = reviewRepository.countByProductId(productId);

        double roundedAvg = 0.0;
        if (avg != null) {
            roundedAvg = BigDecimal.valueOf(avg)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return ResponseEntity.ok(new ReviewSummaryDTO(roundedAvg, count));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ReviewResponseDTO> createOrUpdateReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequestDTO req,
            HttpServletRequest request) {

        User user = getAuthenticatedUser(request);
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        Optional<Review> existingReviewOpt = reviewRepository.findByProductIdAndUserId(productId, user.getId());

        Review review;
        if (existingReviewOpt.isPresent()) {
            // Update existing review (Upsert behavior)
            review = existingReviewOpt.get();
            review.setRating(req.getRating());
            review.setComment(req.getComment());
            review.setCreatedAt(LocalDateTime.now());
        } else {
            // Create new review
            review = new Review();
            review.setProduct(product);
            review.setUser(user);
            review.setRating(req.getRating());
            review.setComment(req.getComment());
        }

        Review savedReview = reviewRepository.save(review);
        return ResponseEntity.status(existingReviewOpt.isPresent() ? HttpStatus.OK : HttpStatus.CREATED)
                .body(mapToDTO(savedReview));
    }

    @DeleteMapping("/{reviewId}")
    @Transactional
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long productId,
            @PathVariable Long reviewId,
            HttpServletRequest request) {

        User user = getAuthenticatedUser(request);
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Review not found"));

        if (!review.getProduct().getId().equals(productId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Review does not belong to this product");
        }

        // Check ownership or ADMIN role
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        boolean isAuthor = review.getUser() != null && review.getUser().getId().equals(user.getId());

        if (!isAuthor && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to delete this review");
        }

        reviewRepository.delete(review);
        return ResponseEntity.ok().build();
    }
}
