"use client";

import type React from "react";

import { useState, useEffect } from "react";

interface UseResponsiveItemsProps {
    containerRef: React.RefObject<HTMLDivElement>;
    itemWidth: number;
    gap: number;
    minItems?: number;
    maxItems?: number;
}

export function useResponsiveItems({
    containerRef,
    itemWidth,
    gap,
    minItems = 1,
    maxItems = 8,
}: UseResponsiveItemsProps) {
    const [itemsPerView, setItemsPerView] = useState(4);

    useEffect(() => {
        const calculateItemsPerView = () => {
            if (!containerRef.current) return;

            const containerWidth = containerRef.current.offsetWidth;
            const padding = 32; // Container padding
            const availableWidth = containerWidth - padding;

            const totalItemWidth = itemWidth + gap;
            const calculatedItems = Math.floor(availableWidth / totalItemWidth);
            const newItemsPerView = Math.max(
                minItems,
                Math.min(calculatedItems, maxItems)
            );

            setItemsPerView(newItemsPerView);
        };

        calculateItemsPerView();

        const handleResize = () => {
            calculateItemsPerView();
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [containerRef, itemWidth, gap, minItems, maxItems]);

    return itemsPerView;
}
