package com.example.e_commerce.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.e_commerce.model.Product;
import com.example.e_commerce.model.ProductImage;
import com.example.e_commerce.repository.ProductImageRepository;
import com.example.e_commerce.repository.ProductRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final com.example.e_commerce.repository.CategoryRepository categoryRepository;
    private final Cloudinary cloudinary;

    // ---- Public READ endpoints ----

    @GetMapping
    public List<Product> getAllProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Integer limit) {

        if ((query == null || query.isBlank()) &&
            (category == null || category.isBlank()) &&
            minPrice == null &&
            maxPrice == null) {

            if ("newest".equalsIgnoreCase(sort) && limit != null) {
                return productRepository.findAll(
                    org.springframework.data.domain.PageRequest.of(0, limit,
                        org.springframework.data.domain.Sort.by(
                            org.springframework.data.domain.Sort.Direction.DESC, "id")))
                    .getContent()
                    .stream()
                    .filter(p -> !p.isArchived())
                    .toList();
            }
            // Return only non-archived products
            return productRepository.findAll().stream()
                    .filter(p -> !p.isArchived())
                    .toList();
        }

        String formattedQuery = null;
        if (query != null && !query.isBlank()) {
            formattedQuery = query.trim().replaceAll("\\s+", " & ");
        }

        return productRepository.searchProducts(formattedQuery, category, minPrice, maxPrice);
    }

    @GetMapping("/categories")
    public List<com.example.e_commerce.dto.CategoryCountDTO> getCategories(
            @RequestParam(required = false) Integer limit) {
        List<com.example.e_commerce.dto.CategoryCountDTO> list = categoryRepository.findAll().stream()
                .map(cat -> new com.example.e_commerce.dto.CategoryCountDTO(
                        cat.getName(),
                        productRepository.countActiveProductsByCategoryName(cat.getName()),
                        cat.getImageUrl()
                ))
                .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                .toList();

        if (limit != null && limit > 0 && limit < list.size()) {
            return list.subList(0, limit);
        }
        return list;
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<List<Product>> getRelatedProducts(@PathVariable Long id) {
        return productRepository.findById(id).map(product -> {
            if (product.getCategory() == null || product.getCategory().isBlank()) {
                return ResponseEntity.ok(List.<Product>of());
            }
            List<Product> related = productRepository.findByCategoryAndIdNot(product.getCategory(), id);
            if (related.size() > 4) {
                related = related.subList(0, 4);
            }
            return ResponseEntity.ok(related);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/images")
    public ResponseEntity<List<ProductImage>> getProductImages(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(productImageRepository.findByProductIdOrderByDisplayOrderAsc(id));
    }

    // ---- Admin WRITE endpoints ----

    @PostMapping
    public ResponseEntity<Product> createProduct(@Valid @RequestBody Product product) {
        if (product.getCategory() == null || product.getCategory().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is required.");
        }
        String categoryName = product.getCategory().trim();
        if (!categoryRepository.existsByNameIgnoreCase(categoryName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Invalid category: '" + categoryName + "'. Category must be an existing managed category.");
        }

        product.setCategory(categoryName);
        product.setIsArchived(false);
        Product savedProduct = productRepository.save(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedProduct);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @Valid @RequestBody Product productDetails) {
        if (productDetails.getCategory() == null || productDetails.getCategory().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category is required.");
        }
        String categoryName = productDetails.getCategory().trim();
        if (!categoryRepository.existsByNameIgnoreCase(categoryName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Invalid category: '" + categoryName + "'. Category must be an existing managed category.");
        }

        return productRepository.findById(id)
                .map(existing -> {
                    existing.setName(productDetails.getName());
                    existing.setDescription(productDetails.getDescription());
                    existing.setRetailPrice(productDetails.getRetailPrice());
                    existing.setStockQuantity(productDetails.getStockQuantity());
                    existing.setCategory(categoryName);
                    // Never overwrite imageUrl or isArchived via PUT body
                    return ResponseEntity.ok(productRepository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Soft-delete: sets isArchived=true instead of hard deleting.
     * Destroys primary Cloudinary image AND all gallery ProductImages from Cloudinary before archiving.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(existing -> {
                    // Destroy primary Cloudinary image if present
                    String publicId = existing.getImagePublicId();
                    if (publicId != null && !publicId.isBlank()) {
                        try {
                            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
                        } catch (Exception e) {
                            System.err.println("Warning: could not delete primary Cloudinary image on product archive: " + e.getMessage());
                        }
                    }

                    // Destroy all gallery Cloudinary images
                    if (existing.getAdditionalImages() != null) {
                        for (ProductImage galleryImg : existing.getAdditionalImages()) {
                            if (galleryImg.getImagePublicId() != null && !galleryImg.getImagePublicId().isBlank()) {
                                try {
                                    cloudinary.uploader().destroy(galleryImg.getImagePublicId(), ObjectUtils.emptyMap());
                                } catch (Exception e) {
                                    System.err.println("Warning: could not delete gallery Cloudinary image on product archive: " + e.getMessage());
                                }
                            }
                        }
                        existing.getAdditionalImages().clear();
                    }

                    // Soft delete — preserve order history integrity
                    existing.setIsArchived(true);
                    existing.setImageUrl(null);
                    existing.setImagePublicId(null);
                    productRepository.save(existing);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
