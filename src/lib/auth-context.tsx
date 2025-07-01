"use client";
import { ReactNode } from "react";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // This can now be simplified since ClerkProvider is in the root layout
    return <>{children}</>;
};
