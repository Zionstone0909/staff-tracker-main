// import type { Product, FeaturedProduct } from "@/types/product";
import type { Category } from "@/types/category";
import type { Deal } from "@/types/deal";

// Mock API functions - replace with your actual API calls
// export const fetchFeaturedProducts = async (): Promise<FeaturedProduct[]> => {
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//     return [ /* ...featured products... */ ];
// };

// export const fetchHighlightedProducts = async (): Promise<Product[]> => {
//     await new Promise((resolve) => setTimeout(resolve, 800));
//     return [ /* ...highlighted products... */ ];
// };

export const fetchCategories = async (): Promise<Category[]> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return [
    { id: "1", name: "Electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&h=300&fit=crop", slug: "electronics", productCount: 1250, color: "#3B82F6" },
    { id: "2", name: "Fashion", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&h=300&fit=crop", slug: "fashion", productCount: 890, color: "#EC4899" },
    { id: "3", name: "Home & Garden", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop", slug: "home-garden", productCount: 650, color: "#10B981" },
    { id: "4", name: "Sports & Fitness", image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop", slug: "sports-fitness", productCount: 420, color: "#F59E0B" },
    { id: "5", name: "Beauty & Health", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop", slug: "beauty-health", productCount: 380, color: "#8B5CF6" },
    { id: "6", name: "Books & Media", image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=300&fit=crop", slug: "books-media", productCount: 290, color: "#EF4444" },
    { id: "7", name: "Automotive", image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=300&h=300&fit=crop", slug: "automotive", productCount: 180, color: "#6366F1" },
    { id: "8", name: "Toys & Games", image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=300&h=300&fit=crop", slug: "toys-games", productCount: 340, color: "#14B8A6" },
  ];
};

export const fetchDealsOfTheDay = async (): Promise<Deal[]> => {
  await new Promise((resolve) => setTimeout(resolve, 900));
  const now = new Date();
  const endDate1 = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const endDate2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const endDate3 = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  return [
    {
      id: "deal-1",
      title: "Premium Skincare Bundle Pack",
      description: "Complete skincare routine with shampoo, conditioner & facewash. Perfect for daily use with natural ingredients.",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop",
      price: 150.0,
      originalPrice: 200.0,
      rating: 4.2,
      maxRating: 5,
      soldCount: 20,
      availableCount: 40,
      endDate: endDate1.toISOString(),
      category: "Beauty & Health",
      slug: "premium-skincare-bundle",
      discount: 25,
    },
    {
      id: "deal-2",
      title: "Rose Gold Diamond Earrings",
      description: "Elegant rose gold earrings with premium diamonds. Perfect for special occasions and daily wear.",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500&h=500&fit=crop",
      price: 1990.0,
      originalPrice: 2000.0,
      rating: 4.8,
      maxRating: 5,
      soldCount: 15,
      availableCount: 40,
      endDate: endDate2.toISOString(),
      category: "Jewelry",
      slug: "rose-gold-diamond-earrings",
      discount: 5,
    },
    {
      id: "deal-3",
      title: "Smart Home Security Camera",
      description: "Advanced security camera with night vision, motion detection, and mobile app control for complete home monitoring.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop",
      price: 299.99,
      originalPrice: 399.99,
      rating: 4.6,
      maxRating: 5,
      soldCount: 35,
      availableCount: 25,
      endDate: endDate3.toISOString(),
      category: "Electronics",
      slug: "smart-security-camera",
      discount: 25,
    },
  ];
};
