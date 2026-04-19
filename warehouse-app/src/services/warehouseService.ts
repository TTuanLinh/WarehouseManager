import type { Warehouse } from '../types/models';
import api from './api';

export type WarehouseMyRole = {
  role: 'ADMIN' | 'STAFF';
};

export type WarehouseMember = {
  userId: number;
  username: string;
  role: string;
};

export const getWarehouses = () => api.get<Warehouse[]>('/warehouses');

export const getWarehouse = (id: number) => api.get<Warehouse>(`/warehouses/${id}`);

export const getMyWarehouseRole = (warehouseId: number) =>
  api.get<WarehouseMyRole>(`/warehouses/${warehouseId}/my-role`);

export const getWarehouseMembers = (warehouseId: number) =>
  api.get<WarehouseMember[]>(`/warehouses/${warehouseId}/members`);

export const addWarehouseMember = (warehouseId: number, username: string, role: 'ADMIN' | 'STAFF') =>
  api.post<WarehouseMember[]>(`/warehouses/${warehouseId}/members`, { username, role });

export const removeWarehouseMember = (warehouseId: number, userId: number) =>
  api.delete(`/warehouses/${warehouseId}/members/${userId}`);

export const getWarehouseName = (id: number) => api.get<string>(`/warehouses/${id}/name`);

export const createWarehouse = (name: string, address?: string, phone?: string) =>
  api.post<Warehouse>('/warehouses', { name, address, phone });

export const updateWarehouseContact = (id: number, address?: string, phone?: string) =>
  api.put<Warehouse>(`/warehouses/${id}/contact`, { address, phone });