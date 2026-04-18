package com.example.warehousemanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OrderItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private Long sourceWarehouseId;
    private Integer quantity;
    private Long unitPrice;
}
