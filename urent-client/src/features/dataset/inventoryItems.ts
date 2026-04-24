import type { InventoryItem } from "../shared/types";

// INVENTORY_ITEMS mockdata
export const INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: 1,
    name: "Sony Alpha a7 IV",
    category: "Camera",
    price: 45,
    statusQuantities: { available: 5, rented: 0, overdue: 0 },
    lastUpdated: "2024-04-09",
  },
  {
    id: 2,
    name: 'MacBook Pro M2 - 14"',
    category: "Laptop",
    price: 65,
    statusQuantities: { available: 1, rented: 1, overdue: 0 },
    lastUpdated: "2024-04-08",
  },
  {
    id: 3,
    name: "Canon EOS R5",
    category: "Camera",
    price: 120,
    statusQuantities: { available: 0, rented: 0, overdue: 0 },
    lastUpdated: "2024-04-07",
  },
  {
    id: 4,
    name: "4-Person Tent",
    category: "Outdoor",
    price: 15,
    statusQuantities: { available: 10, rented: 2, overdue: 0 },
    lastUpdated: "2024-04-09",
  },
  {
    id: 5,
    name: "Tolkien Box Set",
    category: "Books",
    price: 5,
    statusQuantities: { available: 8, rented: 0, overdue: 0 },
    lastUpdated: "2024-04-09",
  },
  {
    id: 6,
    name: "DJI Air 3 Drone",
    category: "Electronics",
    price: 85,
    statusQuantities: { available: 1, rented: 1, overdue: 1 },
    lastUpdated: "2024-04-08",
  },
];
