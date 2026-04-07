import type { Chat, Product } from "./types";

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Sony Alpha a7 IV",
    category: "Camera",
    price: 45,
    status: "Available",
    image: "📷",
    rating: 4.9,
    reviews: 124,
    owner: { name: "Alex Chen", avatar: "👨‍💻", rating: 5.0, trips: 48 },
    description:
      "Sony Alpha a7 IV la may anh hybrid toi uu, ket hop hoan hao giua chat luong hinh anh tinh 33MP va kha nang quay video 4K 60p chuyen nghiep. Phu hop cho ca chup anh su kien va quay vlog.",
    specs: [
      "Cam bien Full-frame Exmor R 33MP",
      "Lay net theo mat thoi gian thuc",
      "Chong rung 5 truc",
      "ISO 50 - 204,800",
    ],
  },
  {
    id: 2,
    name: 'MacBook Pro M2 - 14"',
    category: "Laptop",
    price: 65,
    status: "Active",
    image: "💻",
  },
  {
    id: 3,
    name: "Canon EOS R5",
    category: "Camera",
    price: 120,
    status: "Completed",
    image: "📸",
  },
  {
    id: 4,
    name: "4-Person Tent",
    category: "Outdoor",
    price: 15,
    status: "Available",
    image: "⛺",
  },
  {
    id: 5,
    name: "Tolkien Box Set",
    category: "Books",
    price: 5,
    status: "Available",
    image: "📚",
  },
];

export const CHATS: Chat[] = [
  {
    id: 1,
    name: "Sarah Miller",
    message: "Toi rat quan tam den viec thue may chieu...",
    time: "7m ago",
    active: true,
    avatar: "👩‍💼",
  },
  {
    id: 2,
    name: "Marcus Chen",
    message: "Don hang cua ban da san sang...",
    time: "1h ago",
    active: false,
    avatar: "👨‍🔧",
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    message: "Cam on vi da ho tro nhiet tinh!",
    time: "Yesterday",
    active: false,
    avatar: "👩‍🎨",
  },
];
