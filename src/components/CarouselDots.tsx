"use client";

import { cn } from "@/lib/utils";

interface CarouselDotsProps {
    total: number;
    current: number;
    onDotClick: (index: number) => void;
    className?: string;
}

export function CarouselDots({
    total,
    current,
    onDotClick,
    className,
}: CarouselDotsProps) {
    return (
        <div
            className={cn("flex items-center justify-center gap-2", className)}
        >
            {Array.from({ length: total }).map((_, index) => (
                <button
                    key={index}
                    onClick={() => onDotClick(index)}
                    className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300",
                        "hover:scale-125",
                        index === current
                            ? "bg-primary scale-125 shadow-md"
                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                />
            ))}
        </div>
    );
}
