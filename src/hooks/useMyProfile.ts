// hooks/useMyProfile.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export const useMyProfile = () => {
    return useQuery({
        queryKey: ["my-profile"],
        queryFn: async () => {
            const res = await api.get("/users/me");
            return res.data.user;
        },
    });
};
