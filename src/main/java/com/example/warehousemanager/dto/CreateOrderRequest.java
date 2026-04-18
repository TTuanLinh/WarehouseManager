package com.example.warehousemanager.dto;

import java.util.List;
import lombok.Data;

@Data
public class CreateOrderRequest {
    private Long sellerId;
    private Long destinationWarehouseId;
    private String note;
    private List<CreateOrderItem> items;

    @Data
    public static class CreateOrderItem {
        private Long warehouseId;
        private Long productId;
        private Integer quantity;
    }
}
