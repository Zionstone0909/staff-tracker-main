import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProductSkeletonProps {
    variant?: "default" | "compact" | "featured";
    className?: string;
}

export function ProductSkeleton({
    variant = "default",
    className,
}: ProductSkeletonProps) {
    const isCompact = variant === "compact";
    const isFeatured = variant === "featured";

    return (
        <div
            className={cn(
                "bg-card rounded-lg border p-4 space-y-3",
                isFeatured && "p-6 rounded-xl",
                isCompact && "p-3",
                className
            )}
        >
            {/* Image Skeleton */}
            <Skeleton
                className={cn(
                    "aspect-square rounded-md",
                    isFeatured && "rounded-lg"
                )}
            />

            {/* Content Skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className={cn("h-4 w-3/4", isFeatured && "h-5")} />
                {isFeatured && <Skeleton className="h-3 w-full" />}

                {/* Rating Skeleton */}
                <div className="flex items-center gap-1">
                    <Skeleton className="h-3 w-20" />
                </div>

                {/* Price Skeleton */}
                <div className="flex items-center gap-2">
                    <Skeleton
                        className={cn("h-4 w-16", isFeatured && "h-6 w-20")}
                    />
                    <Skeleton className="h-3 w-12" />
                </div>

                {/* Button Skeleton */}
                <Skeleton className={cn("h-9 w-full", isCompact && "h-8")} />
            </div>
        </div>
    );
}
