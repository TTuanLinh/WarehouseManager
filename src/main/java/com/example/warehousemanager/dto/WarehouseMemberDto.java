package com.example.warehousemanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class WarehouseMemberDto {
    private Long userId;
    private String username;
    private String role;
}
