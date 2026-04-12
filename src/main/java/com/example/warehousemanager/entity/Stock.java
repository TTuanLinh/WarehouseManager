package com.example.warehousemanager.entity;

import lombok.Getter;
import lombok.Setter;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "stock",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"warehouse_id", "product_id"})
    })
@Getter
@Setter
public class Stock {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne
    private Warehouse warehouse;

    @ManyToOne
    private Product product;

    private Integer quantity;
}
