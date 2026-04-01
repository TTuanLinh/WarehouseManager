package com.example.warehousemanager.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Product {
    @Id @GeneratedValue
    private Long id;

    private String name;
    private String sku;

    public Product(Long id) {
        this.id = id;
    }
}
