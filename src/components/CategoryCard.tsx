import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/types/category";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
    category: Category;
    className?: string;
    isActive?: boolean;
}

export function CategoryCard({
    category,
    className,
    isActive = false,
}: CategoryCardProps) {
    return (
        <div className="relative flex flex-col items-center">
            <Link
                to={`/category/${category.slug}`}
                className={cn(
                    "group relative block transition-all duration-500 ease-out",
                    "hover:scale-110 hover:-translate-y-2",
                    isActive && "scale-105",
                    className
                )}
            >
                {/* Main Circle Container */}
                <div className="relative">
                    {/* Outer Ring with Gradient */}
                    <div
                        className={cn(
                            "w-32 h-32 rounded-full p-1 transition-all duration-500",
                            "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
                            "group-hover:from-primary/40 group-hover:via-primary/20 group-hover:to-primary/10",
                            "group-hover:shadow-lg group-hover:shadow-primary/25"
                        )}
                        style={{
                            background: `linear-gradient(135deg, ${category.color}20, ${category.color}10, transparent)`,
                        }}
                    >
                        {/* Inner Circle with Image */}
                        <div className="w-full h-full rounded-full overflow-hidden bg-white shadow-lg relative">
                            {/* Category Image */}
                            <img
                                src={category.image || "/placeholder.svg"}
                                alt={category.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            {/* Overlay on Hover */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />

                            {/* Product Count Badge */}
                            {category.productCount && (
                                <Badge
                                    className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs px-2 py-1 shadow-md"
                                    style={{ backgroundColor: category.color }}
                                >
                                    {category.productCount}+
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </Link>

            {/* Category Name Tooltip - Now positioned outside the Link */}
            <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                <div
                    className="bg-card border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
                    style={{ borderColor: category.color }}
                >
                    <p className="text-sm font-medium text-foreground">
                        {category.name}
                    </p>
                    {category.productCount && (
                        <p className="text-xs text-muted-foreground">
                            {category.productCount} products
                        </p>
                    )}
                </div>
                {/* Tooltip Arrow */}
                <div
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 border-l border-t"
                    style={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: category.color,
                    }}
                />
            </div>
        </div>
    );
}
