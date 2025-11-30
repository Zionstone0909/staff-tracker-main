// // hooks/useProductDetailQuery.ts
// import { useQuery } from "@tanstack/react-query";
// import { api } from "@/lib/axios";
// import { Product } from "./useProductsQuery";

// export const useProductDetailQuery = (id: string) => {
//     return useQuery({
//         queryKey: ["product", id],
//         queryFn: async () => {
//             const res = await api.get(`/products/${id}`);
//             return res.data.product as Product;
//         },
//         enabled: !!id,
//     });
// };
