package com.example.warehousemanager.dto;

import lombok.Data;

@Data
public class ListingUpdateRequest {
    private Long productId;
    private Boolean forSale;
    private Long unitPrice;
}
