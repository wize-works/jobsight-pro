"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";

export function ClarityProvider() {
    useEffect(() => {
        if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_CLARITY_ID) {
            Clarity.init(process.env.NEXT_PUBLIC_CLARITY_ID);
            Clarity.consent();
        }
    }, []);

    return null;
}
