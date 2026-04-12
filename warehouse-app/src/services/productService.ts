import type { Product } from '../types/models';
import api from './api';

export const getProducts = () => api.get<Product[]>('/products');

export const createProduct = (body: { name: string; sku: string }) =>
  api.post<Product>('/products', body);
