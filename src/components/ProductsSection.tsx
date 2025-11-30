// "use client";

// import { ChevronRight, Package, TrendingUp } from "lucide-react";
// import { Button } from "@/components/ui/button";

// import { Skeleton } from "@/components/ui/skeleton";
// import { cn } from "@/lib/utils";
// import { ProductShowcaseCard } from "./ProductShowcaseCard";
// import { useProductsQuery } from "@/hooks/useProductsQuery";

// interface ProductsSectionProps {
//     className?: string;
//     title?: string;
//     subtitle?: string;
//     limit?: number;
// }

// export function ProductsSection({
//     className,
//     title = "Featured Products",
//     subtitle = "Discover our handpicked selection of premium products",
//     limit = 4,
// }: ProductsSectionProps) {
//     const { data, isLoading, error } = useProductsQuery({ limit });

//     if (isLoading) {
//         return (
//             <section
//                 className={cn(
//                     "py-16 bg-gradient-to-b from-muted/30 to-background",
//                     className
//                 )}
//             >
//                 <div className="container mx-auto px-4">
//                     <div className="text-center mb-12">
//                         <Skeleton className="h-10 w-64 mx-auto mb-4" />
//                         <Skeleton className="h-6 w-96 mx-auto" />
//                     </div>
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                         {Array.from({ length: limit }).map((_, i) => (
//                             <div
//                                 key={i}
//                                 className="bg-card rounded-2xl border p-6 h-[500px]"
//                             >
//                                 <Skeleton className="h-64 w-full rounded-lg mb-4" />
//                                 <div className="space-y-3">
//                                     <Skeleton className="h-4 w-3/4" />
//                                     <Skeleton className="h-3 w-full" />
//                                     <Skeleton className="h-3 w-2/3" />
//                                     <Skeleton className="h-6 w-32" />
//                                     <Skeleton className="h-8 w-full" />
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </section>
//         );
//     }

//     if (error || !data?.products) {
//         return (
//             <section
//                 className={cn(
//                     "py-16 bg-gradient-to-b from-muted/30 to-background",
//                     className
//                 )}
//             >
//                 <div className="container mx-auto px-4 text-center">
//                     <div className="max-w-md mx-auto">
//                         <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
//                         <h3 className="text-lg font-semibold text-foreground mb-2">
//                             Unable to load products
//                         </h3>
//                         <p className="text-muted-foreground mb-4">
//                             Please try again later or check your connection.
//                         </p>
//                         <Button
//                             variant="outline"
//                             onClick={() => window.location.reload()}
//                         >
//                             Retry
//                         </Button>
//                     </div>
//                 </div>
//             </section>
//         );
//     }

//     const products = data.products.slice(0, limit);

//     return (
//         <section
//             className={cn(
//                 "py-16 bg-gradient-to-b from-muted/30 to-background",
//                 className
//             )}
//         >
//             <div className="container mx-auto px-4">
//                 {/* Header */}
//                 <div className="text-center mb-12">
//                     <div className="flex items-center justify-center gap-2 mb-4">
//                         <TrendingUp className="h-8 w-8 text-primary" />
//                         <h2 className="text-3xl md:text-4xl font-bold text-foreground">
//                             {title}
//                         </h2>
//                     </div>
//                     <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
//                         {subtitle}
//                     </p>

//                     {/* Stats */}
//                     <div className="flex items-center justify-center gap-8 mt-6">
//                         <div className="text-center">
//                             <div className="text-2xl font-bold text-primary">
//                                 {data.total}
//                             </div>
//                             <div className="text-sm text-muted-foreground">
//                                 Total Products
//                             </div>
//                         </div>
//                         <div className="text-center">
//                             <div className="text-2xl font-bold text-primary">
//                                 {products.filter((p) => p.isFeatured).length}
//                             </div>
//                             <div className="text-sm text-muted-foreground">
//                                 Featured
//                             </div>
//                         </div>
//                         <div className="text-center">
//                             <div className="text-2xl font-bold text-primary">
//                                 {products.filter((p) => p.isHot).length}
//                             </div>
//                             <div className="text-sm text-muted-foreground">
//                                 Hot Items
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Products Grid */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
//                     {products.map((product) => (
//                         <ProductShowcaseCard
//                             key={product._id}
//                             product={product}
//                             className="animate-fade-in"
//                             //   style={{
//                             //     animationDelay: `${index * 150}ms`,
//                             //   }}
//                         />
//                     ))}
//                 </div>

//                 {/* View All Button */}
//                 <div className="text-center">
//                     <Button
//                         size="lg"
//                         variant="outline"
//                         className="bg-transparent group"
//                     >
//                         View All Products
//                         <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
//                     </Button>
//                 </div>
//             </div>
//         </section>
//     );
// }
