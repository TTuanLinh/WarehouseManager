package com.example.warehousemanager.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Rows must live in table {@code product} (singular). Manual SQL often targets {@code products} by mistake. */
@Entity
@Table(name = "product")
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
