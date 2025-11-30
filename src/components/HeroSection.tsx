// import { useQuery } from "@tanstack/react-query";
// import { Button } from "@/components/ui/button";
// import { ArrowRight, ShoppingBag } from "lucide-react";
// import { fetchFeaturedProducts, fetchHighlightedProducts } from "@/lib/api";
// import { ProductSkeleton } from "./ProductSkeleton";
// import { FeaturedProductCard } from "./FeaturedProductCard";
// import { ProductCard } from "./ProductCard";

// export function HeroSection() {
//     const {
//         data: featuredProducts,
//         isLoading: featuredLoading,
//         error: featuredError,
//     } = useQuery({
//         queryKey: ["featured-products"],
//         queryFn: fetchFeaturedProducts,
//     });

//     const {
//         data: highlightedProducts,
//         isLoading: highlightedLoading,
//         error: highlightedError,
//     } = useQuery({
//         queryKey: ["highlighted-products"],
//         queryFn: fetchHighlightedProducts,
//     });

//     return (
//         <section className="relative container mx-auto rounded-2xl px-10 min-h-[70vh] bg-gradient-to-br from-primary/5 to-primary/10 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
//             {/* Background Image */}
//             <div
//                 className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
//                 // style={{
//                 //     backgroundImage:
//                 //         "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop')",
//                 // }}
//             />

//             {/* Background Pattern */}
//             <div className="absolute inset-0 bg-grid-pattern opacity-5" />

//             <div className="container mx-auto px-4 py-6 relative z-10 h-full">
//                 <div className="grid lg:grid-cols-12 gap-6 items-start h-full">
//                     {/* Left Content - Main Banner */}
//                     <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
//                         {/* Hero Text */}
//                         <div className="space-y-6 lg:pt-10">
//                             <div className="space-y-4">
//                                 <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold text-foreground leading-tight">
//                                     Discover Amazing
//                                     <span className="text-primary block">
//                                         Products
//                                     </span>
//                                     <span className="text-2xl md:text-3xl lg:text-4xl font-normal text-muted-foreground">
//                                         at unbeatable prices
//                                     </span>
//                                 </h1>
//                                 <p className="text-lg text-muted-foreground max-w-2xl">
//                                     Shop the latest trends and discover
//                                     exclusive deals on thousands of products.
//                                     From electronics to fashion, we have
//                                     everything you need.
//                                 </p>
//                             </div>

//                             {/* CTA Buttons */}
//                             <div className="flex flex-col sm:flex-row gap-4">
//                                 <Button
//                                     size="lg"
//                                     className="text-lg px-8 py-6 group"
//                                 >
//                                     <ShoppingBag className="mr-2 h-5 w-5" />
//                                     Shop Now
//                                     <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
//                                 </Button>
//                                 <Button
//                                     variant="outline"
//                                     size="lg"
//                                     className="text-lg px-8 py-6 bg-transparent"
//                                 >
//                                     View Collections
//                                 </Button>
//                             </div>
//                         </div>

//                         {/* Featured Products Section */}
//                         <div className="space-y-3 lg:pb-10">
//                             <h2 className="text-xl md:text-2xl font-semibold text-foreground">
//                                 Featured Products
//                             </h2>
//                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                                 {featuredLoading ? (
//                                     Array.from({ length: 3 }).map((_, i) => (
//                                         <ProductSkeleton
//                                             key={i}
//                                             variant="featured"
//                                             className="h-64"
//                                         />
//                                     ))
//                                 ) : featuredError ? (
//                                     <div className="col-span-3 text-center py-4">
//                                         <p className="text-muted-foreground text-sm">
//                                             Failed to load featured products
//                                         </p>
//                                     </div>
//                                 ) : (
//                                     featuredProducts
//                                         ?.slice(0, 3)
//                                         .map((product) => (
//                                             <FeaturedProductCard
//                                                 key={product._id}
//                                                 product={product}
//                                                 className="animate-fade-in h-64"
//                                             />
//                                         ))
//                                 )}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Right Sidebar - Highlighted Products Grid */}
//                     <div className="lg:col-span-5 lg:pt-10 flex flex-col justify-center">
//                         <div className="bg-card/50 backdrop-blur-sm rounded-2xl border shadow-lg p-4 h-fit">
//                             <div className="space-y-4">
//                                 <div className="text-center space-y-1">
//                                     <h3 className="text-lg font-semibold text-foreground">
//                                         Today's Highlights
//                                     </h3>
//                                     <p className="text-xs text-muted-foreground">
//                                         Hand-picked products just for you
//                                     </p>
//                                 </div>

//                                 {/* 2x2 Grid for Highlighted Products */}
//                                 <div className="grid grid-cols-2 gap-3">
//                                     {highlightedLoading ? (
//                                         Array.from({ length: 4 }).map(
//                                             (_, i) => (
//                                                 <ProductSkeleton
//                                                     key={i}
//                                                     variant="compact"
//                                                     className="h-48"
//                                                 />
//                                             )
//                                         )
//                                     ) : highlightedError ? (
//                                         <div className="col-span-2 text-center py-4">
//                                             <p className="text-muted-foreground text-xs">
//                                                 Failed to load products
//                                             </p>
//                                         </div>
//                                     ) : (
//                                         highlightedProducts
//                                             ?.slice(0, 4)
//                                             .map((product) => (
//                                                 <ProductCard
//                                                     key={product._id}
//                                                     product={product}
//                                                     variant="compact"
//                                                     className="animate-fade-in h-48"
//                                                 />
//                                             ))
//                                     )}
//                                 </div>

//                                 {!highlightedLoading && !highlightedError && (
//                                     <Button
//                                         variant="outline"
//                                         size="sm"
//                                         className="w-full bg-transparent text-sm"
//                                     >
//                                         View All Products
//                                         <ArrowRight className="ml-2 h-3 w-3" />
//                                     </Button>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </section>
//     );
// }
