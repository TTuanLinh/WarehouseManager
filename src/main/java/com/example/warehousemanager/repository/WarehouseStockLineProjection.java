package com.example.warehousemanager.repository;

/**
 * Native query result for listing stock lines per warehouse (see {@link StockRepository#listLinesForWarehouse}).
 */
public interface WarehouseStockLineProjection {
    Long getProductId();

    String getProductName();

    String getSku();

    Integer getQuantity();

    Boolean getForSale();

    Long getSalePrice();
}
