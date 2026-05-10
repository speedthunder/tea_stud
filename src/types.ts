export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface Product {
    id: string;
    name: string;
    category: string;
    priceM?: number;
    priceL?: number;
    priceXL?: number;
    description?: string;
    isAvailable: boolean;
    imageUrl?: string;
}

export interface Category {
    id: string;
    name: string;
    displayOrder: number;
}

export interface OrderItem {
    productId: string;
    name: string;
    size: 'M' | 'L' | 'XL';
    sugarLevel: string;
    iceLevel: string;
    toppings: string[];
    price: number;
    quantity: number;
}

export interface Order {
    id: string;
    userId?: string;
    customerName?: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    orderNumber: number;
    createdAt: any;
    updatedAt: any;
}

export interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    role: 'USER' | 'ADMIN';
    createdAt: any;
}
