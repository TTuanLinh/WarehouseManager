package com.example.warehousemanager.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class DailyStatsDto {
    private int day;
    private long importQty;   // tổng IMPORT + ORDER_IMPORT
    private long exportQty;   // tổng EXPORT + ORDER_EXPORT
    private long transferIn;  // TRANSFER toWarehouseId = this warehouse
    private long transferOut; // TRANSFER fromWarehouseId = this warehouse

    // Convenience list response wrapper
    @Getter
    @AllArgsConstructor
    public static class Response {
        private Long warehouseId;
        private String warehouseName;
        private int year;
        private int month;
        private List<DailyStatsDto> days;
    }
}
