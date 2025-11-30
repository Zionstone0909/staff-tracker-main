// "use client";

// import type React from "react";

// import { useState } from "react";
// import { Link } from "react-router-dom";
// import { Star, ShoppingCart, Heart, Eye, Tag, Zap } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import type { Product } from "@/types/product";
// import { cn } from "@/lib/utils";

// interface ProductShowcaseCardProps {
//     product: Product;
//     className?: string;
// }

// export function ProductShowcaseCard({
//     product,
//     className,
// }: ProductShowcaseCardProps) {
//     const [isWishlisted, setIsWishlisted] = useState(false);
//     const [currentImageIndex, setCurrentImageIndex] = useState(0);

//     const primaryImage =
//         product.images?.[currentImageIndex] ||
//         product.images?.[0] ||
//         "/placeholder.svg";
//     const hasMultipleImages = product.images && product.images.length > 1;

//     const handleWishlistToggle = (e: React.MouseEvent) => {
//         e.preventDefault();
//         setIsWishlisted(!isWishlisted);
//     };

//     const handleImageHover = () => {
//         if (hasMultipleImages) {
//             setCurrentImageIndex((prev) => (prev + 1) % product.images!.length);
//         }
//     };

//     const handleImageLeave = () => {
//         setCurrentImageIndex(0);
//     };

//     // Parse HTML description to plain text
//     const getPlainTextDescription = (htmlString: string) => {
//         const div = document.createElement("div");
//         div.innerHTML = htmlString;
//         return div.textContent || div.innerText || "";
//     };

//     return (
//         <div
//             className={cn(
//                 "group relative bg-card rounded-2xl border shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden",
//                 "hover:-translate-y-2 hover:scale-[1.02]",
//                 className
//             )}
//         >
//             {/* Product Badges */}
//             <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
//                 {product.isFeatured && (
//                     <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg">
//                         <Star className="h-3 w-3 mr-1" />
//                         Featured
//                     </Badge>
//                 )}
//                 {product.isHot && (
//                     <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold shadow-lg">
//                         <Zap className="h-3 w-3 mr-1" />
//                         Hot
//                     </Badge>
//                 )}
//                 {product.quantity < 10 && (
//                     <Badge
//                         variant="destructive"
//                         className="font-bold shadow-lg"
//                     >
//                         Low Stock
//                     </Badge>
//                 )}
//             </div>

//             {/* Wishlist Button */}
//             <Button
//                 variant="ghost"
//                 size="icon"
//                 className={cn(
//                     "absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300",
//                     "bg-background/80 backdrop-blur-sm hover:bg-background hover:scale-110",
//                     isWishlisted && "opacity-100 text-red-500"
//                 )}
//                 onClick={handleWishlistToggle}
//             >
//                 <Heart
//                     className={cn("h-4 w-4", isWishlisted && "fill-current")}
//                 />
//             </Button>

//             <Link to={`/product/${product._id}`} className="block">
//                 {/* Image Section */}
//                 <div
//                     className="relative h-64 bg-gradient-to-br from-muted/30 to-muted/60 overflow-hidden"
//                     onMouseEnter={handleImageHover}
//                     onMouseLeave={handleImageLeave}
//                 >
//                     <img
//                         src={primaryImage || "/placeholder.svg"}
//                         alt={product.name}
//                         className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
//                     />

//                     {/* Image Overlay */}
//                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

//                     {/* Quick View Button */}
//                     <Button
//                         size="sm"
//                         className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0"
//                     >
//                         <Eye className="h-4 w-4 mr-2" />
//                         Quick View
//                     </Button>

//                     {/* Image Indicators */}
//                     {hasMultipleImages && (
//                         <div className="absolute bottom-2 right-2 flex gap-1">
//                             {product.images!.map((_, index) => (
//                                 <div
//                                     key={index}
//                                     className={cn(
//                                         "w-1.5 h-1.5 rounded-full transition-all duration-300",
//                                         index === currentImageIndex
//                                             ? "bg-white"
//                                             : "bg-white/50"
//                                     )}
//                                 />
//                             ))}
//                         </div>
//                     )}
//                 </div>

//                 {/* Content Section */}
//                 <div className="p-6 space-y-4">
//                     {/* SKU and Tags */}
//                     <div className="flex items-center justify-between">
//                         <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
//                             SKU: {product.sku}
//                         </span>
//                         {product.tags && product.tags.length > 0 && (
//                             <div className="flex items-center gap-1">
//                                 <Tag className="h-3 w-3 text-muted-foreground" />
//                                 <span className="text-xs text-muted-foreground">
//                                     {product.tags[0]}
//                                 </span>
//                             </div>
//                         )}
//                     </div>

//                     {/* Product Name */}
//                     <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
//                         {product.name}
//                     </h3>

//                     {/* Description */}
//                     <p className="text-sm text-muted-foreground line-clamp-2">
//                         {getPlainTextDescription(product.description)}
//                     </p>

//                     {/* Rating and Reviews */}
//                     <div className="flex items-center gap-2">
//                         <div className="flex items-center">
//                             {Array.from({ length: 5 }).map((_, i) => (
//                                 <Star
//                                     key={i}
//                                     className={cn(
//                                         "h-4 w-4",
//                                         i <
//                                             Math.floor(
//                                                 product.averageRating || 0
//                                             )
//                                             ? "fill-yellow-400 text-yellow-400"
//                                             : "text-gray-300"
//                                     )}
//                                 />
//                             ))}
//                         </div>
//                         <span className="text-sm text-muted-foreground">
//                             ({product.averageRating?.toFixed(1) || "0.0"})
//                         </span>
//                         {product.reviewCount && product.reviewCount > 0 && (
//                             <span className="text-xs text-muted-foreground">
//                                 • {product.reviewCount} reviews
//                             </span>
//                         )}
//                     </div>

//                     {/* Price and Stock */}
//                     <div className="flex items-center justify-between">
//                         <div className="space-y-1">
//                             <div className="text-2xl font-bold text-foreground">
//                                 ${product.price.toFixed(2)}
//                             </div>
//                             <div className="text-xs text-muted-foreground">
//                                 {product.quantity > 0
//                                     ? `${product.quantity} in stock`
//                                     : "Out of stock"}
//                             </div>
//                         </div>

//                         {/* Add to Cart Button */}
//                         <Button
//                             size="sm"
//                             disabled={product.quantity === 0}
//                             className={cn(
//                                 "group/btn transition-all duration-300",
//                                 product.quantity === 0 &&
//                                     "opacity-50 cursor-not-allowed"
//                             )}
//                             onClick={(e) => {
//                                 e.preventDefault();
//                                 // Add to cart logic here
//                                 console.log("Added to cart:", product.name);
//                             }}
//                         >
//                             <ShoppingCart className="h-4 w-4 mr-2 group-hover/btn:animate-bounce" />
//                             {product.quantity === 0
//                                 ? "Sold Out"
//                                 : "Add to Cart"}
//                         </Button>
//                     </div>
//                 </div>
//             </Link>
//         </div>
//     );
// }
