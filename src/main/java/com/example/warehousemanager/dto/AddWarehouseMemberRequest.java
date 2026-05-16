package com.example.warehousemanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AddWarehouseMemberRequest {
    @NotBlank(message = "Username không được để trống")
    private String username;

    /** ADMIN hoặc STAFF */
    @NotBlank(message = "Vai trò không được để trống")
    @Pattern(regexp = "ADMIN|STAFF", message = "Vai trò phải là ADMIN hoặc STAFF")
    private String role;
}
