import { apiClient } from '../../../../lib/api/apiClient';

export const fetchOrderDetail = async (orderId: string) => {
  const response = await apiClient.get(`/api/v1/orders/${orderId}`);
  return response.data.data;
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await apiClient.patch(`/api/v1/orders/${orderId}/status`, { status });
  return response.data.data;
};
