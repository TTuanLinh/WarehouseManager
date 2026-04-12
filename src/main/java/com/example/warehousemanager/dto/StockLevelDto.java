package com.example.warehousemanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StockLevelDto {
    private Long warehouseId;
    private String warehouseName;
    private Long productId;
    private String productName;
    private Integer quantity;
}
