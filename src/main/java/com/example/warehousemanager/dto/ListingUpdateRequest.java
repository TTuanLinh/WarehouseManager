package com.example.warehousemanager.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ListingUpdateRequest {
    @NotNull(message = "Mã sản phẩm không được để trống")
    private Long productId;

    @NotNull(message = "Trạng thái bày bán không được để trống")
    private Boolean forSale;

    @Min(value = 1000, message = "Giá bán không được dưới 1000đ")
    private Long unitPrice;
}
