package com.example.warehousemanager.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import java.time.LocalDateTime;

@Entity
public class StockTransaction {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne
    private Product product;

    private Integer quantity;

    private String type;

    private Long fromWarehouseId;
    private Long toWarehouseId;

    private LocalDateTime createdAt;
}