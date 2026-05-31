import { apiClient } from '../../../../lib/api/apiClient';
import type { Review } from '../../shared/types';

export const fetchReviewByOrder = async (orderId: string): Promise<Review | null> => {
  const response = await apiClient.get(`/api/v1/reviews/order/${orderId}`);
  return response.data.data;
};

export const fetchReviewsByProduct = async (productId: string): Promise<Review[]> => {
  const response = await apiClient.get(`/api/v1/reviews/product/${productId}`);
  return response.data.data || [];
};

export const createReview = async (reviewData: {
  orderId: string;
  rating: number;
  content: string;
}): Promise<Review> => {
  const response = await apiClient.post('/api/v1/reviews', reviewData);
  return response.data.data;
};
