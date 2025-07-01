import { redirect } from "next/navigation";

export default async function OnboardingPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const params = await searchParams;
    const token = params.token;

    if (token) {
        // Redirect to the unified registration page with the token
        redirect(`/register?token=${token}`);
    } else {
        // No token, redirect to landing
        redirect("/");
    }
}