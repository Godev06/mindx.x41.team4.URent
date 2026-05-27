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

  /**
   * Create a new product.
   */
  async createProduct(product: Omit<Product, "id" | "_id">): Promise<Product> {
    const res = await apiClient.post<ApiResponse<Product>>("/api/v1/products", product);
    return res.data.data;
  },

  /**
   * Update an existing product.
   */
  async updateProduct(id: string | number, product: Partial<Product>): Promise<Product> {
    const res = await apiClient.put<ApiResponse<Product>>(`/api/v1/products/${id}`, product);
    return res.data.data;
  },

  /**
   * Delete a product.
   */
  async deleteProduct(id: string | number): Promise<void> {
    await apiClient.delete<ApiResponse<unknown>>(`/api/v1/products/${id}`);
  },

  /**
   * Archive a product.
   */
  async archiveProduct(id: string | number): Promise<void> {
    await apiClient.patch<ApiResponse<unknown>>(`/api/v1/products/${id}/archive`);
  },
};
