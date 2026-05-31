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
  async getProducts(params?: {
    q?: string;
    category?: string;
    limit?: number;
    minPrice?: number;
    maxPrice?: number;
    lat?: number;
    lng?: number;
    radiusInKm?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Product[]> {
    const res = await apiClient.get<ApiResponse<Product[]>>("/api/v1/products", {
      params,
    });
    return res.data.data;
  },

  /** Fetch only the products owned by the authenticated user (inventory) */
  async getMyProducts(params?: {
    q?: string;
    category?: string;
    limit?: number;
  }): Promise<Product[]> {
    const res = await apiClient.get<ApiResponse<Product[]>>("/api/v1/products/my", {
      params,
    });
    return res.data.data;
  },

  async getProductById(id: string | number): Promise<Product> {
    const res = await apiClient.get<ApiResponse<Product>>(`/api/v1/products/${id}`);
    return res.data.data;
  },

  async createProduct(product: Omit<Product, "id" | "_id">): Promise<Product> {
    const res = await apiClient.post<ApiResponse<Product>>("/api/v1/products", product);
    return res.data.data;
  },

  async updateProduct(id: string | number, product: Partial<Product>): Promise<Product> {
    const res = await apiClient.put<ApiResponse<Product>>(`/api/v1/products/${id}`, product);
    return res.data.data;
  },

  async deleteProduct(id: string | number): Promise<void> {
    await apiClient.delete<ApiResponse<unknown>>(`/api/v1/products/${id}`);
  },

  async archiveProduct(id: string | number): Promise<void> {
    await apiClient.patch<ApiResponse<unknown>>(`/api/v1/products/${id}/archive`);
  },

  async getPublicStats(): Promise<{ totalProducts: number; totalUsers: number; totalTransactions: number }> {
    const res = await apiClient.get<ApiResponse<{ totalProducts: number; totalUsers: number; totalTransactions: number }>>("/api/v1/public-stats");
    return res.data.data;
  },
};