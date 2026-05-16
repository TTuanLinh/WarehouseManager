package com.example.warehousemanager.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class WarehouseContactUpdateRequest {
    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    private String address;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;
}
