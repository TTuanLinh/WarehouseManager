package com.example.warehousemanager.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class CreateOrderRequest {
    @NotNull(message = "Người bán không được để trống")
    private Long sellerId;

    private Long destinationWarehouseId;
    private String note;

    @NotEmpty(message = "Đơn hàng phải có ít nhất 1 sản phẩm")
    @Valid
    private List<CreateOrderItem> items;

    @Data
    public static class CreateOrderItem {
        @NotNull(message = "Mã kho không được để trống")
        private Long warehouseId;

        @NotNull(message = "Mã sản phẩm không được để trống")
        private Long productId;

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng phải lớn hơn hoặc bằng 1")
        private Integer quantity;
    }
}
