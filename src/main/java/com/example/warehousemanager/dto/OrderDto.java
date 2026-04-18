package com.example.warehousemanager.dto;

import com.example.warehousemanager.entity.OrderStatus;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OrderDto {
    private Long id;
    private Long buyerId;
    private String buyerUsername;
    private Long sellerId;
    private String sellerUsername;
    private Long destinationWarehouseId;
    private String destinationWarehouseName;
    private String recipientAddress;
    private String recipientPhone;
    private OrderStatus status;
    private Long totalAmount;
    private String note;
    private LocalDateTime createdAt;
    private List<OrderItemDto> items;
}
