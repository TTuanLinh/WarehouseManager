import type { StockLevel, WarehouseStockLine } from '../types/models';
import api from './api';

export type InventoryLineRequest = { productId: number; quantity: number };

export const getLowStock = (threshold = 10) =>
  api.get<StockLevel[]>('/inventory/low-stock', { params: { threshold } });

export const getWarehouseStocks = (warehouseId: number) =>
  api.get<WarehouseStockLine[]>(`/inventory/${warehouseId}/stocks`);

export const importToWarehouse = (warehouseId: number, body: InventoryLineRequest[]) =>
  api.post(`/inventory/${warehouseId}/import`, body);

export const exportFromWarehouse = (warehouseId: number, body: InventoryLineRequest[]) =>
  api.post(`/inventory/${warehouseId}/export`, body);

export const setWarehouseStockQuantity = (
  warehouseId: number,
  productId: number,
  quantity: number
) => api.put(`/inventory/${warehouseId}/stock`, { productId, quantity });

/** Gỡ hoàn toàn dòng tồn (sản phẩm vẫn còn trong hệ thống). */
export const removeStockLineFromWarehouse = (warehouseId: number, productId: number) =>
  api.delete(`/inventory/${warehouseId}/stock/${productId}`);

export const transferStock = (
  warehouseId: number,
  body: { productId: number; toWarehouse: number; quantity: number }
) => api.post(`/inventory/${warehouseId}/transfer`, body);
