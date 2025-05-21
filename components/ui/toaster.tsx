"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"

interface ToasterProps {
    position?: "top-start" | "top-center" | "top-end" | "middle-start" | "middle-center" | "middle-end" | "bottom-start" | "bottom-center" | "bottom-end"
}

export function Toaster({ position = "bottom-end" }: ToasterProps) {
    const { toasts } = useToast()

    // Map position to DaisyUI toast classes
    const positionClasses = {
        "top-start": "toast-top toast-start",
        "top-center": "toast-top toast-center",
        "top-end": "toast-top toast-end",
        "middle-start": "toast-middle toast-start",
        "middle-center": "toast-middle toast-center",
        "middle-end": "toast-middle toast-end",
        "bottom-start": "toast-bottom toast-start",
        "bottom-center": "toast-bottom toast-center",
        "bottom-end": "toast-bottom toast-end",
    }

    return (
        <div className={`toast z-50 ${positionClasses[position]}`}>
            {toasts.map((toast) => {
                // Map variant to DaisyUI alert classes
                const variantClass = toast.variant ? `alert-${toast.variant}` : '';
                const styleClass = toast.style ? `alert-${toast.style}` : '';

                return (
                    <div
                        key={toast.id}
                        className={`alert ${variantClass} ${styleClass}`}
                        role="alert"
                    >
                        {toast.icon && (
                            <span className="mr-2">{toast.icon}</span>
                        )}
                        <div className="flex flex-col">
                            {toast.title && <span className="font-bold">{toast.title}</span>}
                            {toast.description && <span>{toast.description}</span>}
                        </div>
                        {toast.action && (
                            <div className="flex-none">
                                {toast.action}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    )
}
