package com.example.warehousemanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MarketplaceListingDto {
    private Long warehouseId;
    private String warehouseName;
    private String warehouseAddress;
    private Long productId;
    private String productName;
    private String sku;
    private Integer availableQuantity;
    private Long unitPrice;
    private Long sellerId;
    private String sellerUsername;
}
