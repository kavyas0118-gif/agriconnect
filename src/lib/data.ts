// No mock data allowed for production. Interfaces only.

export interface Product {
  id: string;
  name: string;
  category: "fruits" | "vegetables" | "grains" | "dairy" | "spices";
  price: number;
  marketPrice: number;
  unit: string;
  quantity: number;
  farmer: Farmer;
  image: string;
  organic: boolean;
  rating: number;
  reviews: number;
  description: string;
}

export interface Farmer {
  id: string;
  name: string;
  location: string;
  distance: number;
  rating: number;
  avatar: string;
  crops: number;
  verified: boolean;
}

export interface Order {
  id: string;
  product: string;
  quantity: number;
  total: number;
  status: "packed" | "shipped" | "delivered" | "pending";
  date: string;
  farmer: string;
  buyer: string;
  estimatedDelivery: string;
}

export interface ChatMessage {
  id: string;
  sender: "farmer" | "buyer";
  text: string;
  time: string;
  type: "text" | "offer";
  offerPrice?: number;
}
