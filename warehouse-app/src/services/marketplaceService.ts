import type { MarketplaceListing } from '../types/models';
import api from './api';

export const getSellerListings = (sellerId: number, query?: string) =>
  api.get<MarketplaceListing[]>(`/marketplace/${sellerId}/listings`, {
    params: query ? { q: query } : undefined,
  });
