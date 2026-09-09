package com.example.e_commerce.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "addresses")
@Data
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    private String label;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String postalCode;
    private String country;

    private boolean isDefaultShipping = false;
    private boolean isDefaultBilling = false;
}
