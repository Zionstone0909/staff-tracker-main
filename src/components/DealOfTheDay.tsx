"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchDealsOfTheDay } from "@/lib/api";

import { Skeleton } from "@/components/ui/skeleton";
import { useResponsiveItems } from "@/hooks/use-responsive-items";
import { cn } from "@/lib/utils";
import { CarouselDots } from "./CarouselDots";
import { DealCard } from "./DealCard";

interface DealOfTheDayProps {
    className?: string;
}

export function DealOfTheDay({ className }: DealOfTheDayProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(
        null
    ) as React.RefObject<HTMLDivElement>;

    const {
        data: deals,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["deals-of-the-day"],
        queryFn: fetchDealsOfTheDay,
    });

    // Use responsive items hook for carousel
    const itemsPerView = useResponsiveItems({
        containerRef,
        itemWidth: 320, // Approximate card width
        gap: 24, // gap-6
        minItems: 1,
        maxItems: 3,
    });

    const totalSlides = deals ? Math.ceil(deals.length / itemsPerView) : 0;

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    };

    if (isLoading) {
        return (
            <section
                className={cn(
                    "py-16 bg-gradient-to-b from-background to-muted/30",
                    className
                )}
            >
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Skeleton className="h-10 w-64 mx-auto mb-4" />
                        <Skeleton className="h-6 w-96 mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div
                                key={i}
                                className="bg-card rounded-xl border p-4 h-[480px]"
                            >
                                <Skeleton className="h-48 w-full rounded-lg mb-4" />
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-3 w-2/3" />
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-8 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error || !deals) {
        return (
            <section
                className={cn(
                    "py-16 bg-gradient-to-b from-background to-muted/30",
                    className
                )}
            >
                <div className="container mx-auto px-4 text-center">
                    <p className="text-muted-foreground">
                        Failed to load deals of the day
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section
            className={cn(
                "py-16 bg-gradient-to-b from-background to-muted/30",
                className
            )}
        >
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Clock className="h-8 w-8 text-primary" />
                        <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                            Deal of the Day
                        </h2>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Limited time offers with incredible savings. Don't miss
                        out on these amazing deals!
                    </p>
                </div>

                {/* Carousel Container */}
                <div ref={containerRef} className="relative">
                    {/* Deals Carousel */}
                    <div className="relative overflow-hidden">
                        {totalSlides > 1 ? (
                            // Carousel Mode
                            <div
                                className="flex transition-transform duration-700 ease-in-out"
                                style={{
                                    transform: `translateX(-${
                                        currentIndex * 100
                                    }%)`,
                                }}
                            >
                                {Array.from({ length: totalSlides }).map(
                                    (_, slideIndex) => (
                                        <div
                                            key={slideIndex}
                                            className="w-full flex-shrink-0"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                                                {deals
                                                    .slice(
                                                        slideIndex *
                                                            itemsPerView,
                                                        (slideIndex + 1) *
                                                            itemsPerView
                                                    )
                                                    .map((deal) => (
                                                        <DealCard
                                                            key={deal.id}
                                                            deal={deal}
                                                            className="animate-fade-in"
                                                            //   style={{
                                                            //     animationDelay: `${index * 100}ms`,
                                                            //   }}
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            // Static Mode - All items fit in one view
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                                {deals.map((deal) => (
                                    <DealCard
                                        key={deal.id}
                                        deal={deal}
                                        className="animate-fade-in"
                                        // style={{
                                        //   animationDelay: `${index * 100}ms`,
                                        // }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Navigation Arrows - Only show if carousel is needed */}
                    {totalSlides > 1 && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border-2 hover:bg-background hover:scale-110 transition-all duration-300 z-10"
                                onClick={goToPrevious}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border-2 hover:bg-background hover:scale-110 transition-all duration-300 z-10"
                                onClick={goToNext}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>

                {/* Carousel Dots - Only show if carousel is needed */}
                {totalSlides > 1 && (
                    <CarouselDots
                        total={totalSlides}
                        current={currentIndex}
                        onDotClick={goToSlide}
                        className="mt-8"
                    />
                )}

                {/* View All Deals Button */}
                <div className="text-center mt-12">
                    <Button
                        size="lg"
                        variant="outline"
                        className="bg-transparent"
                    >
                        View All Deals
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
