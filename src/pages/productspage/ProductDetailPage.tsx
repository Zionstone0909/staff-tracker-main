// // pages/ProductDetailPage.tsx
// import { useParams } from "react-router-dom";
// import { useProductDetailQuery } from "@/hooks/useProductDetailQuery";

// export function ProductDetailPage() {
//     const { id } = useParams();
//     const { data: product, isLoading, isError } = useProductDetailQuery(id!);

//     if (isLoading) return <div className="p-6">Loading...</div>;
//     if (isError || !product)
//         return <div className="p-6">Product not found.</div>;

//     return (
//         <div className="p-6 max-w-4xl mx-auto">
//             <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="border rounded-lg p-4 bg-muted">
//                     {/* Placeholder for image */}
//                     <div className="bg-gray-200 h-64 rounded" />
//                 </div>

//                 <div>
//                     <p className="text-lg mb-2">{product.description}</p>
//                     <p className="text-2xl font-semibold mb-2">
//                         ৳{product.price}
//                     </p>
//                     <p className="text-muted-foreground mb-4">
//                         Stock: {product.quantity}
//                     </p>

//                     <button className="bg-primary text-white px-6 py-2 rounded hover:opacity-90 transition">
//                         Add to Cart
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// }
