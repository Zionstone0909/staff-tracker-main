// import { Star, ShoppingCart, Heart } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import type { Product } from "@/types/product";
// import { cn } from "@/lib/utils";

// interface ProductCardProps {
//     product: Product;
//     variant?: "default" | "compact";
//     className?: string;
// }

// export function ProductCard({
//     product,
//     variant = "default",
//     className,
// }: ProductCardProps) {
//     const isCompact = variant === "compact";

//     return (
//         <div
//             className={cn(
//                 "group relative bg-card rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden",
//                 isCompact ? "p-2" : "p-4",
//                 className
//             )}
//         >
//             {/* Badges */}
//             <div className="absolute top-1.5 left-1.5 z-10 flex flex-col gap-1">
//                 {product.isNew && (
//                     <Badge
//                         variant="secondary"
//                         className="bg-green-100 text-green-800 text-xs px-1 py-0"
//                     >
//                         New
//                     </Badge>
//                 )}
//                 {product.discount && (
//                     <Badge variant="destructive" className="text-xs px-1 py-0">
//                         -{product.discount}%
//                     </Badge>
//                 )}
//             </div>

//             {/* Wishlist Button */}
//             <Button
//                 variant="ghost"
//                 size="icon"
//                 className={cn(
//                     "absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
//                     isCompact ? "h-6 w-6" : "h-8 w-8"
//                 )}
//             >
//                 <Heart className={cn(isCompact ? "h-3 w-3" : "h-4 w-4")} />
//             </Button>

//             {/* Product Image */}
//             <div
//                 className={cn(
//                     "relative overflow-hidden rounded-md bg-gray-100",
//                     isCompact ? "aspect-square mb-2" : "aspect-square mb-3"
//                 )}
//             >
//                 <img
//                     src={product.image || "/placeholder.svg"}
//                     alt={product.name}
//                     className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
//                 />
//             </div>

//             {/* Product Info */}
//             <div className={cn("space-y-1", isCompact && "space-y-1")}>
//                 <div>
//                     <p
//                         className={cn(
//                             "text-muted-foreground uppercase tracking-wide",
//                             isCompact ? "text-xs" : "text-xs"
//                         )}
//                     >
//                         {product.category}
//                     </p>
//                     <h3
//                         className={cn(
//                             "font-medium text-foreground line-clamp-2",
//                             isCompact ? "text-xs" : "text-sm"
//                         )}
//                     >
//                         {product.name}
//                     </h3>
//                 </div>

//                 {/* Rating */}
//                 {product.rating && (
//                     <div className="flex items-center gap-1">
//                         <div className="flex items-center">
//                             {Array.from({ length: 5 }).map((_, i) => (
//                                 <Star
//                                     key={i}
//                                     className={cn(
//                                         isCompact ? "h-2.5 w-2.5" : "h-3 w-3",
//                                         i < Math.floor(product.rating!)
//                                             ? "fill-yellow-400 text-yellow-400"
//                                             : "text-gray-300"
//                                     )}
//                                 />
//                             ))}
//                         </div>
//                         <span
//                             className={cn(
//                                 "text-muted-foreground",
//                                 isCompact ? "text-xs" : "text-xs"
//                             )}
//                         >
//                             ({product.rating})
//                         </span>
//                     </div>
//                 )}

//                 {/* Price */}
//                 <div className="flex items-center gap-1">
//                     <span
//                         className={cn(
//                             "font-semibold text-foreground",
//                             isCompact ? "text-xs" : "text-sm"
//                         )}
//                     >
//                         ${product.price}
//                     </span>
//                     {product.originalPrice && (
//                         <span
//                             className={cn(
//                                 "text-muted-foreground line-through",
//                                 isCompact ? "text-xs" : "text-xs"
//                             )}
//                         >
//                             ${product.originalPrice}
//                         </span>
//                     )}
//                 </div>

//                 {/* Add to Cart Button */}
//                 <Button
//                     size={isCompact ? "sm" : "default"}
//                     className={cn(
//                         "w-full bg-transparent",
//                         isCompact && "h-7 text-xs"
//                     )}
//                     variant="outline"
//                 >
//                     <ShoppingCart
//                         className={cn(
//                             "mr-1",
//                             isCompact ? "h-3 w-3" : "h-4 w-4"
//                         )}
//                     />
//                     {isCompact ? "Add" : "Add to Cart"}
//                 </Button>
//             </div>
//         </div>
//     );
// }
