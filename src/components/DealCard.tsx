import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import type { Deal } from "@/types/deal";
import { cn } from "@/lib/utils";
import { CountdownTimer } from "./CountdownTimer";

interface DealCardProps {
    deal: Deal;
    className?: string;
}

export function DealCard({ deal, className }: DealCardProps) {
    const totalStock = deal.soldCount + deal.availableCount;
    const soldPercentage = (deal.soldCount / totalStock) * 100;
    const discountPercentage =
        deal.discount ||
        Math.round(
            ((deal.originalPrice - deal.price) / deal.originalPrice) * 100
        );

    return (
        <div
            className={cn(
                "bg-card rounded-xl border shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300 flex flex-col",
                className
            )}
        >
            {/* Image Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-muted/50 to-muted h-48 flex-shrink-0">
                <img
                    src={deal.image || "/placeholder.svg"}
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Discount Badge */}
                {discountPercentage > 0 && (
                    <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground font-bold text-xs">
                        -{discountPercentage}%
                    </Badge>
                )}

                {/* Category Badge */}
                <Badge
                    variant="secondary"
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs"
                >
                    {deal.category}
                </Badge>
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-1">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: deal.maxRating || 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className={cn(
                                "h-3 w-3",
                                i < Math.floor(deal.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                            )}
                        />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">
                        ({deal.rating})
                    </span>
                </div>

                {/* Title */}
                <Link to={`/product/${deal.slug}`} className="group/title">
                    <h3 className="text-sm font-bold text-foreground mb-2 line-clamp-2 group-hover/title:text-primary transition-colors">
                        {deal.title}
                    </h3>
                </Link>

                {/* Description */}
                <p className="text-muted-foreground text-xs mb-3 line-clamp-2 flex-1">
                    {deal.description}
                </p>

                {/* Price */}
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-foreground">
                        ${deal.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                        ${deal.originalPrice.toFixed(2)}
                    </span>
                </div>

                {/* Add to Cart Button */}
                <Button size="sm" className="w-full mb-3 group/btn text-xs">
                    <ShoppingCart className="h-3 w-3 mr-1 group-hover/btn:animate-bounce" />
                    Add to Cart
                </Button>

                {/* Stock Status */}
                <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                            Sold:{" "}
                            <span className="font-semibold text-foreground">
                                {deal.soldCount}
                            </span>
                        </span>
                        <span className="text-muted-foreground">
                            Left:{" "}
                            <span className="font-semibold text-foreground">
                                {deal.availableCount}
                            </span>
                        </span>
                    </div>
                    <Progress value={soldPercentage} className="h-1.5" />
                </div>

                {/* Countdown Timer */}
                <CountdownTimer endDate={deal.endDate} className="mt-auto" />
            </div>
        </div>
    );
}
