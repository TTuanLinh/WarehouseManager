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
      size: params.size ?? 200,
      sort: 'createdAt,desc',
      ...(params.warehouseId != null ? { warehouseId: params.warehouseId } : {}),
    },
  });

export type DailyStats = {
  day: number;
  importQty: number;
  exportQty: number;
  transferIn: number;
  transferOut: number;
};

export type MonthlyStatsResponse = {
  warehouseId: number;
  warehouseName: string;
  year: number;
  month: number;
  days: DailyStats[];
};

export const getMonthlyStats = (warehouseId: number, year: number, month: number) =>
  api.get<MonthlyStatsResponse>('/transactions/stats', {
    params: { warehouseId, year, month },
  });
