import { apiClient } from "../../../../lib/api/apiClient";
import type { Product } from "../../shared/types";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    limit?: number;
    hasMore?: boolean;
    nextCursor?: string | null;
  };
}

export const productService = {
  /**
   * Fetch all active/available products from BE.
   * Supports search query `q` and filtering by category `category`.
   */
  async getProducts(params?: {
    q?: string;
    category?: string;
    limit?: number;
  }): Promise<Product[]> {
    const res = await apiClient.get<ApiResponse<Product[]>>("/api/v1/products", {
      params,
    });
    return res.data.data;
  },

  /**
   * Fetch a single product by its ID from BE.
   */
  async getProductById(id: string | number): Promise<Product> {
    const res = await apiClient.get<ApiResponse<Product>>(`/api/v1/products/${id}`);
    return res.data.data;
  },
};
