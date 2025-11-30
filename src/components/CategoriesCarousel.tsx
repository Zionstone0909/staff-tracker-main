/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCategories } from "@/lib/api";

import { useResponsiveItems } from "@/hooks/use-responsive-items";
import { cn } from "@/lib/utils";
import { CarouselDots } from "./CarouselDots";
import { CategoryCard } from "./CategoryCard";

interface CategoriesCarouselProps {
    autoplayInterval?: number;
    className?: string;
}

export function CategoriesCarousel({
    autoplayInterval = 3000,
    className,
}: CategoriesCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(
        null
    ) as React.RefObject<HTMLDivElement>;

    const {
        data: categories,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["categories"],
        queryFn: fetchCategories,
    });

    // Use responsive items hook
    const itemsPerView = useResponsiveItems({
        containerRef,
        itemWidth: 128, // w-32
        gap: 32, // gap-8
        minItems: 1,
        maxItems: categories?.length || 8,
    });

    const totalSlides = categories
        ? Math.ceil(categories.length / itemsPerView)
        : 0;

    // Reset current index if it exceeds total slides
    useEffect(() => {
        if (currentIndex >= totalSlides && totalSlides > 0) {
            setCurrentIndex(0);
        }
    }, [totalSlides, currentIndex]);

    // Autoplay functionality
    useEffect(() => {
        if (!isPlaying || isPaused || !categories || totalSlides <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % totalSlides);
        }, autoplayInterval);

        return () => clearInterval(interval);
    }, [isPlaying, isPaused, autoplayInterval, totalSlides, categories]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    };

    const togglePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleMouseEnter = () => {
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
    };

    if (isLoading) {
        return (
            <section className={cn("py-12 bg-background", className)}>
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                            Shop by Category
                        </h2>
                        <p className="text-muted-foreground">
                            Discover products across all categories
                        </p>
                    </div>
                    <div className="flex justify-center gap-8 flex-wrap">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="w-32 h-32 bg-muted rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error || !categories) {
        return (
            <section className={cn("py-12 bg-background", className)}>
                <div className="container mx-auto px-4 text-center">
                    <p className="text-muted-foreground">
                        Failed to load categories
                    </p>
                </div>
            </section>
        );
    }

    const getCurrentSlideCategories = () => {
        const startIndex = currentIndex * itemsPerView;
        return categories.slice(startIndex, startIndex + itemsPerView);
    };

    return (
        <section
            className={cn(
                "py-12 bg-gradient-to-b from-background to-muted/20",
                className
            )}
        >
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Shop by Category
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Discover amazing products across all our carefully
                        curated categories
                    </p>
                </div>

                {/* Carousel Container */}
                <div
                    ref={containerRef}
                    className="relative pb-20"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {/* Categories Display */}
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
                                            <div
                                                className="flex justify-center gap-8 px-4"
                                                style={{
                                                    minHeight: "200px",
                                                }}
                                            >
                                                {categories
                                                    .slice(
                                                        slideIndex *
                                                            itemsPerView,
                                                        (slideIndex + 1) *
                                                            itemsPerView
                                                    )
                                                    .map((category, _index) => (
                                                        <CategoryCard
                                                            key={category.id}
                                                            category={category}
                                                            className="animate-fade-in"
                                                            // style={{
                                                            //     animationDelay: `${
                                                            //         index * 100
                                                            //     }ms`,
                                                            // }}
                                                        />
                                                    ))}
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            // Static Mode - All items fit in one view
                            <div
                                className="flex justify-center gap-8 px-4"
                                style={{
                                    minHeight: "200px",
                                }}
                            >
                                {categories.map((category, _index) => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        className="animate-fade-in"
                                        // style={{
                                        //     animationDelay: `${index * 100}ms`,
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
                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border-2 hover:bg-background hover:scale-110 transition-all duration-300 z-10"
                                onClick={goToPrevious}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm border-2 hover:bg-background hover:scale-110 transition-all duration-300 z-10"
                                onClick={goToNext}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {/* Play/Pause Button - Only show if carousel is needed */}
                    {totalSlides > 1 && (
                        <Button
                            variant="outline"
                            size="icon"
                            className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm border-2 hover:bg-background hover:scale-110 transition-all duration-300 z-10"
                            onClick={togglePlayPause}
                        >
                            {isPlaying ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4" />
                            )}
                        </Button>
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

                {/* Categories Count */}
                <div className="text-center mt-6">
                    <p className="text-sm text-muted-foreground">
                        {totalSlides > 1 ? (
                            <>
                                Showing {getCurrentSlideCategories().length} of{" "}
                                {categories.length} categories • {itemsPerView}{" "}
                                per view
                            </>
                        ) : (
                            <>Showing all {categories.length} categories</>
                        )}
                    </p>
                </div>
            </div>
        </section>
    );
}
