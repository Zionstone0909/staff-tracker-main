// import { useQuery } from "@tanstack/react-query";
// import { api } from "@/lib/axios";
// import type { ProductsResponse } from "@/types/product";

// type ProductsQueryParams = {
//     search?: string;
//     page?: number;
//     limit?: number;
// };

// export const useProductsQuery = ({
//     search = "",
//     page = 1,
//     limit = 8,
// }: ProductsQueryParams = {}) => {
//     return useQuery<ProductsResponse>({
//         queryKey: ["products", search, page, limit],
//         queryFn: async () => {
//             const res = await api.get("/products", {
//                 params: { search, page, limit },
//             });
//             return res.data;
//         },
//         staleTime: 1000 * 60 * 5, // 5 minutes
//     });
// };
