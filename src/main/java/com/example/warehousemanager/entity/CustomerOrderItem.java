package com.example.warehousemanager.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "customer_order_item")
@Getter
@Setter
public class CustomerOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private CustomerOrder order;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Long sourceWarehouseId;

    @Column(nullable = false)
    private String productNameSnapshot;

    @Column(nullable = false)
    private String skuSnapshot;

    @Column(nullable = false)
    private Long unitPrice;

    @Column(nullable = false)
    private Integer quantity;
}
