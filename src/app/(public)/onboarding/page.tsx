import { redirect } from "next/navigation";

export default function OnboardingPage({
    searchParams,
}: {
    searchParams: { token?: string };
}) {
    const token = searchParams.token;

    if (token) {
        // Redirect to the unified registration page with the token
        redirect(`/register?token=${token}`);
    } else {
        // No token, redirect to landing
        redirect("/");
    }
}