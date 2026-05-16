package com.example.warehousemanager.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderReceiveRequest {
    @NotNull(message = "Mã kho không được để trống")
    private Long warehouseId;
}
