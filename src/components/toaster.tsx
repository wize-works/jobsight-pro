"use client"

import { TOAST_REMOVE_DELAY, useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"

export function Toaster() {
    const { toasts } = useToast()
    const [isMounted, setIsMounted] = useState(false)
    const [progress, setProgress] = useState<{ [key: string]: number }>({})

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Add progress bar animation effect
    useEffect(() => {
        const progressTimers: { [key: string]: NodeJS.Timeout } = {}
        const progressIntervals: { [key: string]: NodeJS.Timeout } = {}

        toasts.forEach(toast => {
            if (toast.open && toast.autoClose && !progressTimers[toast.id]) {
                // Initialize progress for this toast
                setProgress(prev => ({ ...prev, [toast.id]: 0 }))

                // Calculate increments based on TOAST_REMOVE_DELAY
                // We want to update roughly 30 times per second
                const totalSteps = TOAST_REMOVE_DELAY / 30; // approx 30ms intervals
                const increment = 100 / totalSteps;

                // Update progress every 30ms
                progressIntervals[toast.id] = setInterval(() => {
                    setProgress(prev => {
                        const newProgress = Math.min(100, (prev[toast.id] || 0) + increment);
                        return { ...prev, [toast.id]: newProgress };
                    });
                }, 30);

                // Clear interval when toast should be closed
                progressTimers[toast.id] = setTimeout(() => {
                    clearInterval(progressIntervals[toast.id]);
                    delete progressIntervals[toast.id];
                    delete progressTimers[toast.id];
                }, TOAST_REMOVE_DELAY);
            } else if (!toast.open && progressIntervals[toast.id]) {
                // Clean up if toast is closed
                clearInterval(progressIntervals[toast.id]);
                clearTimeout(progressTimers[toast.id]);
                delete progressIntervals[toast.id];
                delete progressTimers[toast.id];
            }
        });

        // Cleanup
        return () => {
            Object.values(progressIntervals).forEach(interval => clearInterval(interval));
            Object.values(progressTimers).forEach(timer => clearTimeout(timer));
        };
    }, [toasts]);

    if (!isMounted) return null

    return (
        <div className="toast-container fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map(({ id, title, description, variant, open, autoClose }) => {
                if (!open) return null

                // Map variant to DaisyUI alert classes
                const alertClass = variant ? `alert-${variant}` : "alert-info"

                return (
                    <div key={id} className={`alert ${alertClass} relative overflow-hidden`}>
                        <div className="flex items-center space-x-6">
                            {variant === "info" && <i className="fas fa-info-circle text-2xl shrink-0" />}
                            {variant === "success" && <i className="fas fa-check-circle text-2xl shrink-0" />}
                            {variant === "warning" && <i className="fas fa-exclamation-triangle text-2xl shrink-0" />}
                            {variant === "error" && <i className="fas fa-times-circle text-2xl shrink-0" />}

                            <div>
                                {title && <h3 className="font-bold">{title}</h3>}
                                {description && <div className="text-sm">{description}</div>}
                            </div>
                        </div>

                        {/* Progress bar - ensure this is visible */}
                        {autoClose && (
                            <div className="absolute bottom-0 left-0 h-1 bg-base-content bg-opacity-20 w-full">
                                <div
                                    className="h-full bg-current transition-all duration-100 ease-linear"
                                    style={{
                                        width: `${progress[id] || 0}%`,
                                        opacity: 0.6
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}