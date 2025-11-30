"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
    endDate: string;
    className?: string;
    onExpired?: () => void;
}

export function CountdownTimer({
    endDate,
    className,
    onExpired,
}: CountdownTimerProps) {
    const { timeLeft, isExpired } = useCountdown(endDate);

    if (isExpired) {
        onExpired?.();
        return (
            <div className={cn("text-center", className)}>
                <p className="text-destructive font-semibold text-xs">
                    Deal Expired!
                </p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-2", className)}>
            <p className="text-xs text-muted-foreground font-medium text-center">
                Ends in:
            </p>

            <div className="flex items-center justify-center gap-1">
                <div className="text-center">
                    <div className="bg-primary text-primary-foreground rounded px-1.5 py-1 min-w-[32px]">
                        <p className="text-xs font-bold leading-none">
                            {timeLeft.days}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">D</p>
                </div>

                <span className="text-muted-foreground text-xs">:</span>

                <div className="text-center">
                    <div className="bg-primary text-primary-foreground rounded px-1.5 py-1 min-w-[32px]">
                        <p className="text-xs font-bold leading-none">
                            {timeLeft.hours}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">H</p>
                </div>

                <span className="text-muted-foreground text-xs">:</span>

                <div className="text-center">
                    <div className="bg-primary text-primary-foreground rounded px-1.5 py-1 min-w-[32px]">
                        <p className="text-xs font-bold leading-none">
                            {timeLeft.minutes}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">M</p>
                </div>

                <span className="text-muted-foreground text-xs">:</span>

                <div className="text-center">
                    <div className="bg-primary text-primary-foreground rounded px-1.5 py-1 min-w-[32px]">
                        <p className="text-xs font-bold leading-none">
                            {timeLeft.seconds}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">S</p>
                </div>
            </div>
        </div>
    );
}
