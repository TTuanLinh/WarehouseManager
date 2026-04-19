package com.example.warehousemanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserProfileDto {
    private String username;
    private boolean hasBankQr;
}
