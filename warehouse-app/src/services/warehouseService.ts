import type { Warehouse } from '../types/models';
import api from './api';

export const getWarehouses = () => api.get<Warehouse[]>('/warehouses');

export const getWarehouse = (id: number) => api.get<Warehouse>(`/warehouses/${id}`);

export const getWarehouseName = (id: number) => api.get<string>(`/warehouses/${id}/name`);

export const createWarehouse = (name: string, address?: string, phone?: string) =>
  api.post<Warehouse>('/warehouses', { name, address, phone });

export const updateWarehouseContact = (id: number, address?: string, phone?: string) =>
  api.put<Warehouse>(`/warehouses/${id}/contact`, { address, phone });