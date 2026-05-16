package com.example.warehousemanager.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import lombok.Data;

@Getter
@Setter
@Data
public class TransferRequest {
    @NotNull(message = "Mã sản phẩm không được để trống")
    private Long productId;

    @NotNull(message = "Kho đích không được để trống")
    private Long toWarehouse;

    @Min(value = 1, message = "Số lượng chuyển phải lớn hơn hoặc bằng 1")
    private int quantity;
}
