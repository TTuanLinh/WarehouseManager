package com.example.warehousemanager.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.Data;

@Getter
@Setter
@Data
public class TransferRequest {
    private Long productId;
    private Long fromWarehouse;
    private Long toWarehouse;
    private int quantity;
}
