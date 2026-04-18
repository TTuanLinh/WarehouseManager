import type { Order } from '../types/models';
import api from './api';

export type CreateOrderPayload = {
  sellerId: number;
  destinationWarehouseId: number;
  note?: string;
  items: { warehouseId: number; productId: number; quantity: number }[];
};

export const getOrders = (role: 'buyer' | 'seller') =>
  api.get<Order[]>('/orders', { params: { role } });

export const createOrder = (payload: CreateOrderPayload) => api.post<Order>('/orders', payload);

export const sellerConfirmOrder = (orderId: number) => api.post<Order>(`/orders/${orderId}/seller-confirm`);

export const buyerConfirmReceived = (orderId: number) => api.post<Order>(`/orders/${orderId}/buyer-received`);

export const sellerConfirmPayment = (orderId: number) =>
  api.post<Order>(`/orders/${orderId}/seller-confirm-payment`);
