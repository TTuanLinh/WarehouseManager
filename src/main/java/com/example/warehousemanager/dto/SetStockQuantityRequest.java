package com.example.warehousemanager.dto;

import lombok.Data;

@Data
public class SetStockQuantityRequest {
    private Long productId;
    private Integer quantity;
}
