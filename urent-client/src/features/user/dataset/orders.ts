import type { Order } from "../shared/types";

// ORDERS mockdata
export const ORDERS: Order[] = [
  {
    id: "#A102",
    productId: 1,
    productName: "Sony Alpha a7 IV",
    customerName: "Nguyen Van A",
    startDate: "2024-04-10",
    endDate: "2024-04-15",
    totalPrice: 270,
    status: "delivered",
    image: "📷",
  },
  {
    id: "#A103",
    productId: 2,
    productName: 'MacBook Pro M2 - 14"',
    customerName: "Tran Thi B",
    startDate: "2024-04-08",
    endDate: "2024-04-17",
    totalPrice: 585,
    status: "shipped",
    image: "💻",
  },
  {
    id: "#A104",
    productId: 4,
    productName: "4-Person Tent",
    customerName: "Pham Duc C",
    startDate: "2024-04-12",
    endDate: "2024-04-14",
    totalPrice: 30,
    status: "confirmed",
    image: "⛺",
  },
  {
    id: "#A105",
    productId: 6,
    productName: "DJI Air 3 Drone",
    customerName: "Le Minh D",
    startDate: "2024-04-09",
    endDate: "2024-04-18",
    totalPrice: 680,
    status: "pending",
    image: "🚁",
  },
  {
    id: "#A106",
    productId: 3,
    productName: "Canon EOS R5",
    customerName: "Hoang Thu E",
    startDate: "2024-03-20",
    endDate: "2024-03-25",
    totalPrice: 720,
    status: "delivered",
    image: "📸",
  },
  // Thêm nhiều đơn hàng mẫu, khớp với PRODUCTS
  ...Array.from({ length: 10 }, (_, i) => {
    const statusList = ["pending", "confirmed", "shipped", "delivered"] as const;
    return {
      id: `#A20${i}`,
      productId: 7 + i,
      productName: `Sample Product ${i + 1}`,
      customerName: `Customer ${i + 1}`,
      startDate: `2024-04-${10 + i}`,
      endDate: `2024-04-${12 + i}`,
      totalPrice: 100 + i * 10,
      status: statusList[i % 4],
      image: "🛒",
    };
  }),
];
