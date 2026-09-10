package com.example.e_commerce.controller;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.e_commerce.model.Product;
import com.example.e_commerce.model.ProductImage;
import com.example.e_commerce.repository.ProductImageRepository;
import com.example.e_commerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Admin-only product image management endpoints using Cloudinary.
 * All routes under /api/admin/** are protected by SecurityConfig (hasRole ADMIN).
 */
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5174")
public class AdminProductController {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final Cloudinary cloudinary;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );
    private static final long MAX_FILE_SIZE = 5L * 1024 * 1024; // 5MB

    /**
     * POST /api/admin/products/{id}/image
     * Upload and set the primary cover image for a product.
     */
    @PostMapping("/{id}/image")
    public ResponseEntity<Product> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        validateFile(file);

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", "products",
                    "resource_type", "image"
            ));

            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");

            if (secureUrl == null || publicId == null) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Cloudinary upload failed: missing secure_url or public_id in response");
            }

            // Cleanup old Cloudinary primary image if replacing
            if (product.getImagePublicId() != null && !product.getImagePublicId().isBlank()) {
                try {
                    cloudinary.uploader().destroy(product.getImagePublicId(), ObjectUtils.emptyMap());
                } catch (Exception e) {
                    System.err.println("Warning: failed to delete previous Cloudinary image: " + e.getMessage());
                }
            }

            product.setImageUrl(secureUrl);
            product.setImagePublicId(publicId);
            return ResponseEntity.ok(productRepository.save(product));

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to upload image to Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * DELETE /api/admin/products/{id}/image
     * Removes primary cover image from Cloudinary and clears Product image fields.
     */
    @DeleteMapping("/{id}/image")
    public ResponseEntity<Product> deleteImage(@PathVariable Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (product.getImagePublicId() == null || product.getImagePublicId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product does not have an image to delete.");
        }

        try {
            cloudinary.uploader().destroy(product.getImagePublicId(), ObjectUtils.emptyMap());
            product.setImageUrl(null);
            product.setImagePublicId(null);
            return ResponseEntity.ok(productRepository.save(product));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to delete image from Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * POST /api/admin/products/{id}/images
     * Upload one or multiple gallery images for a product.
     * Enforces maximum 6 total images per product (primary + gallery combined).
     */
    @PostMapping("/{id}/images")
    @Transactional
    public ResponseEntity<List<ProductImage>> uploadGalleryImages(
            @PathVariable Long id,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "file", required = false) MultipartFile singleFile) {

        List<MultipartFile> uploadFiles = new ArrayList<>();
        if (files != null && !files.isEmpty()) {
            uploadFiles.addAll(files);
        } else if (singleFile != null && !singleFile.isEmpty()) {
            uploadFiles.add(singleFile);
        }

        if (uploadFiles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No image files provided.");
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        int currentTotal = (product.getImageUrl() != null && !product.getImageUrl().isBlank() ? 1 : 0)
                + product.getAdditionalImages().size();

        if (currentTotal + uploadFiles.size() > 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot upload images. A product can have a maximum of 6 total images (primary + gallery combined). Current total: "
                            + currentTotal + ", attempting to add: " + uploadFiles.size());
        }

        // Validate all files prior to any upload call
        for (MultipartFile file : uploadFiles) {
            validateFile(file);
        }

        int maxOrder = product.getAdditionalImages().stream()
                .mapToInt(img -> img.getDisplayOrder() != null ? img.getDisplayOrder() : 0)
                .max().orElse(0);

        try {
            for (MultipartFile file : uploadFiles) {
                Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                        "folder", "products",
                        "resource_type", "image"
                ));

                String secureUrl = (String) uploadResult.get("secure_url");
                String publicId = (String) uploadResult.get("public_id");

                if (secureUrl == null || publicId == null) {
                    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                            "Cloudinary upload failed: missing secure_url or public_id in response");
                }

                ProductImage galleryImg = new ProductImage();
                galleryImg.setProduct(product);
                galleryImg.setImageUrl(secureUrl);
                galleryImg.setImagePublicId(publicId);
                galleryImg.setDisplayOrder(++maxOrder);

                product.getAdditionalImages().add(galleryImg);
            }

            productRepository.save(product);
            return ResponseEntity.ok(product.getAdditionalImages());

        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to upload gallery images to Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * DELETE /api/admin/products/{id}/images/{imageId}
     * Removes a gallery image from Cloudinary and deletes its database record.
     */
    @DeleteMapping("/{id}/images/{imageId}")
    @Transactional
    public ResponseEntity<Void> deleteGalleryImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        ProductImage target = product.getAdditionalImages().stream()
                .filter(img -> img.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Gallery image not found for this product"));

        try {
            if (target.getImagePublicId() != null && !target.getImagePublicId().isBlank()) {
                cloudinary.uploader().destroy(target.getImagePublicId(), ObjectUtils.emptyMap());
            }

            product.getAdditionalImages().remove(target);
            productRepository.save(product);
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Failed to delete gallery image from Cloudinary: " + e.getMessage(), e);
        }
    }

    /**
     * PUT /api/admin/products/{id}/images/{imageId}/set-primary
     * Promotes a gallery image to primary cover image.
     * Moves existing primary into the gallery as a new ProductImage row.
     */
    @PutMapping("/{id}/images/{imageId}/set-primary")
    @Transactional
    public ResponseEntity<Product> setPrimaryImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        ProductImage galleryTarget = product.getAdditionalImages().stream()
                .filter(img -> img.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Gallery image not found for this product"));

        String oldPrimaryUrl = product.getImageUrl();
        String oldPrimaryPublicId = product.getImagePublicId();

        // Promote gallery image to primary
        product.setImageUrl(galleryTarget.getImageUrl());
        product.setImagePublicId(galleryTarget.getImagePublicId());

        // Remove promoted image from gallery list
        product.getAdditionalImages().remove(galleryTarget);

        // Move demoted primary image into gallery if it existed
        if (oldPrimaryUrl != null && !oldPrimaryUrl.isBlank()) {
            int maxOrder = product.getAdditionalImages().stream()
                    .mapToInt(img -> img.getDisplayOrder() != null ? img.getDisplayOrder() : 0)
                    .max().orElse(0);

            ProductImage demoted = new ProductImage();
            demoted.setProduct(product);
            demoted.setImageUrl(oldPrimaryUrl);
            demoted.setImagePublicId(oldPrimaryPublicId);
            demoted.setDisplayOrder(maxOrder + 1);

            product.getAdditionalImages().add(demoted);
        }

        Product saved = productRepository.save(product);
        return ResponseEntity.ok(saved);
    }

    // ---- Helper Methods ----

    private void validateFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid file type '" + contentType + "'. Only JPEG, PNG, and WebP images are allowed.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "File too large (" + (file.getSize() / 1024 / 1024) + "MB). Maximum allowed size is 5MB.");
        }

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file is empty.");
        }
    }
}
