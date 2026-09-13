package com.example.e_commerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponseDTO {
    private Long id;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private String reviewerName;
    private String reviewerCustomerGroup;
}
