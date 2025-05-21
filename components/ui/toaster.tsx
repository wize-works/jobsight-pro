"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"

interface ToasterProps {
    position?: "top-left" | "top-center" | "top-right" | "middle-left" | "middle-center" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right"
}

export function Toaster({ position = "bottom-right" }: ToasterProps) {
    const { toasts } = useToast()

    // Map position to DaisyUI toast classes
    const positionClasses = {
        "top-left": "toast-top toast-start",
        "top-center": "toast-top toast-center",
        "top-right": "toast-top toast-end",
        "middle-left": "toast-middle toast-start",
        "middle-center": "toast-middle toast-center",
        "middle-right": "toast-middle toast-end",
        "bottom-left": "toast-bottom toast-start",
        "bottom-center": "toast-bottom toast-center",
        "bottom-right": "toast-bottom toast-end",
    }

    return (
        <div className={`toast z-50 ${positionClasses[position]}`}>
            {toasts.map((toast) => {
                // Map variant to DaisyUI alert classes
                const variantClass = toast.variant ? `alert-${toast.variant}` : '';
                const styleClass = toast.style ? `alert-${toast.style}` : ''; return (
                    <div
                        key={toast.id}
                        className={`alert ${variantClass} ${styleClass} mb-2 shadow-lg animate-in fade-in slide-in-from-right-10 duration-300`}
                        role="alert"
                        style={{ opacity: toast.open ? 1 : 0, transition: 'opacity 200ms ease-out' }}
                    >
                        {toast.variant === "info" && !toast.icon && <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        {toast.variant === "success" && !toast.icon && <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        {toast.variant === "warning" && !toast.icon && <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                        {toast.variant === "error" && !toast.icon && <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        {toast.icon && (
                            <span className="mr-2">{toast.icon}</span>
                        )}
                        <div className="flex flex-col">
                            {toast.title && <span className="font-bold">{toast.title}</span>}
                            {toast.description && <span>{toast.description}</span>}
                        </div>
                        {toast.action && (
                            <div className="flex-none ml-auto">
                                {toast.action}
                            </div>
                        )}
                        <button
                            onClick={() => toast.onOpenChange?.(false)}
                            className="btn btn-ghost btn-xs btn-circle ml-2"
                            aria-label="Close notification"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                );
            })}
        </div>
    )
}
