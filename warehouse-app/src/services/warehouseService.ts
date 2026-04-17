import type { Warehouse } from '../types/models';
import api from './api';

export const getWarehouses = () => api.get<Warehouse[]>('/warehouses');

export const getWarehouse = (id: number) => api.get<Warehouse>(`/warehouses/${id}`);

export const getWarehouseName = (id: number) => api.get<string>(`/warehouses/${id}/name`);