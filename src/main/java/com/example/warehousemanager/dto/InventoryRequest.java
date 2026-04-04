package com.example.warehousemanager.dto;

import lombok.Data;

@Data
public class InventoryRequest {
    private Long productId;
    private Long warehouseId;
    private Integer quantity;

}
