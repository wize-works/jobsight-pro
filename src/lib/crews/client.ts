import { Crew } from '@/types/crews';

/**
 * Client-side utility to fetch crews from API
 * Replaces direct server action calls
 */
export async function getCrewsClient(): Promise<Crew[]> {
    try {
        const response = await fetch('/api/crews');
        if (!response.ok) {
            throw new Error('Failed to fetch crews');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching crews:', error);
        return [];
    }
}

/**
 * Client-side utility to get available crews
 * Replaces direct server action calls
 */
export async function getAvailableCrewsClient(): Promise<Crew[]> {
    try {
        const response = await fetch('/api/crews?available=true');
        if (!response.ok) {
            throw new Error('Failed to fetch available crews');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching available crews:', error);
        return [];
    }
}

/**
 * Client-side function to get available crews with member information
 * Uses API route for proper Next.js 15 patterns
 */
export async function getAvailableCrewsWithMemberInfoClient(): Promise<any[]> {
    try {
        const response = await fetch('/api/crews/available/with-member-info');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching crews with member info:', error);
        return [];
    }
}
