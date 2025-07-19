import { SubscriptionPlan } from '@/types/subscription';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Server-side utility to load subscription plans from static file
 * Replaces the server action for API route usage
 */
export async function loadSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
        const filePath = join(
            process.cwd(),
            "docs",
            "jobsight_pricing.json",
        );
        const fileContent = readFileSync(filePath, "utf8");
        return JSON.parse(fileContent);
    } catch (error) {
        console.error("Error loading subscription plans:", error);
        return [];
    }
}
