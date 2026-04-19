package com.example.warehousemanager.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddWarehouseMemberRequest {
    private String username;
    /** ADMIN hoặc STAFF */
    private String role;
}
