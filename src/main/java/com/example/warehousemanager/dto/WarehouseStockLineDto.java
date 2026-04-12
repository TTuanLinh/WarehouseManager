package com.example.warehousemanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WarehouseStockLineDto {
    private Long productId;
    private String productName;
    private String sku;
    private Integer quantity;
}
