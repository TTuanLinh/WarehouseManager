import type { Page, StockTransaction } from '../types/models';
import api from './api';

export type TransactionQuery = {
  page?: number;
  size?: number;
  warehouseId?: number;
};

export const getTransactions = (params: TransactionQuery = {}) =>
  api.get<Page<StockTransaction>>('/transactions', {
    params: {
      page: params.page ?? 0,
      size: params.size ?? 20,
      sort: 'createdAt,desc',
      ...(params.warehouseId != null ? { warehouseId: params.warehouseId } : {}),
    },
  });
