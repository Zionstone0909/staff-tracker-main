export interface Deal {
    id: string;
    title: string;
    description: string;
    image: string;
    price: number;
    originalPrice: number;
    rating: number;
    maxRating?: number;
    soldCount: number;
    availableCount: number;
    endDate: string; // ISO date string
    category: string;
    slug: string;
    discount?: number;
}
