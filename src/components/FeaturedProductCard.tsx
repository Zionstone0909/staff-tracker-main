// import { Star, ArrowRight } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import type { FeaturedProduct } from "@/types/product";
// import { cn } from "@/lib/utils";

// interface FeaturedProductCardProps {
//     product: FeaturedProduct;
//     className?: string;
// }

// export function FeaturedProductCard({
//     product,
//     className,
// }: FeaturedProductCardProps) {
//     return (
//         <div
//             className={cn(
//                 "group relative bg-card/80 backdrop-blur-sm rounded-xl border shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden p-4",
//                 className
//             )}
//         >
//             {/* Badges */}
//             <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
//                 {product.isNew && (
//                     <Badge
//                         variant="secondary"
//                         className="bg-green-100 text-green-800 text-xs"
//                     >
//                         New
//                     </Badge>
//                 )}
//                 {product.discount && (
//                     <Badge variant="destructive" className="text-xs">
//                         -{product.discount}%
//                     </Badge>
//                 )}
//             </div>

//             <div className="flex flex-col h-full">
//                 {/* Product Image */}
//                 <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
//                     <img
//                         src={product.image || "/placeholder.svg"}
//                         alt={product.name}
//                         className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
//                     />
//                 </div>

//                 {/* Product Info */}
//                 <div className="flex-1 space-y-2">
//                     <div>
//                         <p className="text-xs text-muted-foreground uppercase tracking-wide">
//                             {product.category}
//                         </p>
//                         <h3 className="text-sm font-semibold text-foreground line-clamp-2">
//                             {product.name}
//                         </h3>
//                     </div>

//                     {/* Rating */}
//                     {product.rating && (
//                         <div className="flex items-center gap-1">
//                             <div className="flex items-center">
//                                 {Array.from({ length: 5 }).map((_, i) => (
//                                     <Star
//                                         key={i}
//                                         className={cn(
//                                             "h-3 w-3",
//                                             i < Math.floor(product.rating!)
//                                                 ? "fill-yellow-400 text-yellow-400"
//                                                 : "text-gray-300"
//                                         )}
//                                     />
//                                 ))}
//                             </div>
//                             <span className="text-xs text-muted-foreground">
//                                 ({product.rating})
//                             </span>
//                         </div>
//                     )}

//                     {/* Price */}
//                     <div className="flex items-center gap-2">
//                         <span className="text-base font-bold text-foreground">
//                             ${product.price}
//                         </span>
//                         {product.originalPrice && (
//                             <span className="text-xs text-muted-foreground line-through">
//                                 ${product.originalPrice}
//                             </span>
//                         )}
//                     </div>
//                 </div>

//                 {/* Action Button */}
//                 <Button size="sm" className="w-full mt-3 group text-xs">
//                     Shop Now
//                     <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
//                 </Button>
//             </div>
//         </div>
//     );
// }
