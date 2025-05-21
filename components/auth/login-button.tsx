"use client";

import { LoginLink } from "@kinde-oss/kinde-auth-nextjs";
import { ReactNode } from "react";

interface LoginButtonProps {
    children: ReactNode;
    className?: string;
}

export default function LoginButton({ children, className }: LoginButtonProps) {
    return (
        <LoginLink className={className}>
            {children}
        </LoginLink>
    );
}
