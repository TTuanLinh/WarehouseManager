export type AuthResponse = {
  token: string;
  userId: number;
  username: string;
};

export type Warehouse = {
  id: number;
  name: string;
};

export type ProductRef = {
  id: number;
  name: string;
  sku: string;
};

export type StockTransaction = {
  id: number;
  product: ProductRef;
  quantity: number;
  type: string;
  warehouseId: number | null;
  fromWarehouseId: number | null;
  toWarehouseId: number | null;
  createdAt: string;
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
};

export type StockLevel = {
  warehouseId: number;
  warehouseName: string;
  productId: number;
  productName: string;
  quantity: number;
};

/** One product line in a warehouse (GET /inventory/:id/stocks). */
export type WarehouseStockLine = {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
};
