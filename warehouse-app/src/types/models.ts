export type AuthResponse = {
  token: string;
  userId: number;
  username: string;
};

export type Warehouse = {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
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
  forSale: boolean;
  salePrice: number;
};

export type Product = {
  id: number;
  name: string;
  sku: string;
};

export type UserBrief = {
  id: number;
  username: string;
};

export type MarketplaceListing = {
  warehouseId: number;
  warehouseName: string;
  warehouseAddress: string | null;
  productId: number;
  productName: string;
  sku: string;
  availableQuantity: number;
  unitPrice: number;
  sellerId: number;
  sellerUsername: string;
};

export type OrderStatus =
  | 'PENDING_SELLER_CONFIRM'
  | 'IN_TRANSIT'
  | 'AWAITING_PAYMENT'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  sourceWarehouseId: number;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: number;
  buyerId: number;
  buyerUsername: string;
  sellerId: number;
  sellerUsername: string;
  destinationWarehouseId: number | null;
  destinationWarehouseName: string | null;
  recipientAddress: string | null;
  recipientPhone: string | null;
  status: OrderStatus;
  totalAmount: number;
  note: string | null;
  createdAt: string;
  items: OrderItem[];
};
