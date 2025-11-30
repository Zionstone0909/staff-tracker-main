export interface Product {
    _id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    description: string;
    tags?: string[];
    // images?: string[];
    isFeatured?: boolean;
    isHot?: boolean;
    averageRating?: number;
    reviewCount?: number;
    createdBy?: string;
    reviews?: Review[];
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

export interface Review {
    user: string;
    rating: number;
    comment: string;
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface FeaturedProduct extends Product {
    isFeatured: true;
    discount?: number;
}

export interface ProductsResponse {
    message: string;
    count: number;
    total: number;
    page: number;
    limit: number;
    products: Product[];
}
