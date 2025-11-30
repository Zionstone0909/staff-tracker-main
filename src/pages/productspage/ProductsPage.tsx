// // pages/ProductsPage.tsx
// import { useState } from "react";
// import { useProductsQuery } from "@/hooks/useProductsQuery";
// import { Link } from "react-router-dom";

// export function ProductsPage() {
//     const [search, setSearch] = useState("");
//     const [page, setPage] = useState(1);

//     const { data, isLoading, isError } = useProductsQuery({
//         search,
//         page,
//         limit: 3,
//     });
//     console.log(data);

//     if (isLoading) return <p>Loading products...</p>;
//     if (isError) return <p>Error loading products.</p>;

//     return (
//         <div className="space-y-6 p-4">
//             <input
//                 type="text"
//                 placeholder="Search products..."
//                 className="border rounded px-4 py-2"
//                 value={search}
//                 onChange={(e) => {
//                     setSearch(e.target.value);
//                     setPage(1); // reset to first page when search changes
//                 }}
//             />

//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 {data?.products.map((product) => (
//                     <Link to={`/products/${product._id}`} key={product._id}>
//                         <div className="border p-4 rounded shadow hover:shadow-md transition">
//                             <h2 className="font-semibold">{product.name}</h2>
//                             <p className="text-muted text-sm">
//                                 {product.description}
//                             </p>
//                             <p className="font-bold mt-1">৳{product.price}</p>
//                         </div>
//                     </Link>
//                 ))}
//             </div>

//             {/* Pagination */}
//             <div className="flex justify-center gap-4 mt-6">
//                 <button
//                     disabled={page === 1}
//                     onClick={() => setPage((prev) => prev - 1)}
//                     className="px-3 py-1 border rounded disabled:opacity-50"
//                 >
//                     Previous
//                 </button>
//                 <button
//                     disabled={(data?.total ?? 0) <= page * 3}
//                     onClick={() => setPage((prev) => prev + 1)}
//                     className="px-3 py-1 border rounded disabled:opacity-50"
//                 >
//                     Next
//                 </button>
//             </div>
//         </div>
//     );
// }
