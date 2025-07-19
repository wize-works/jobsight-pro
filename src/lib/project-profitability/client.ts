import type {
    ProjectProfitabilityData,
    ProjectProfitabilitySummary
} from './server';

/**
 * Client-side function to get project profitability data
 * Uses API route for proper Next.js 15 patterns
 */
export async function getProjectProfitabilityDataClient(filters?: {
    status?: string;
    clientId?: string;
    riskLevel?: string;
    dateRange?: { start: string; end: string };
}): Promise<{
    projects: ProjectProfitabilityData[];
    summary: ProjectProfitabilitySummary;
}> {
    try {
        const searchParams = new URLSearchParams();

        if (filters) {
            if (filters.status && filters.status !== 'all') {
                searchParams.append('status', filters.status);
            }
            if (filters.clientId) {
                searchParams.append('clientId', filters.clientId);
            }
            if (filters.riskLevel && filters.riskLevel !== 'all') {
                searchParams.append('riskLevel', filters.riskLevel);
            }
            if (filters.dateRange) {
                searchParams.append('startDate', filters.dateRange.start);
                searchParams.append('endDate', filters.dateRange.end);
            }
        }

        const url = `/api/project-profitability${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching project profitability data:', error);
        return {
            projects: [],
            summary: {
                totalProjects: 0,
                totalBudget: 0,
                totalSpend: 0,
                totalProfit: 0,
                averageMargin: 0,
                profitableProjects: 0,
                unprofitableProjects: 0,
                atRiskProjects: 0
            }
        };
    }
}

/**
 * Client-side function to get project profitability trends
 * Uses API route for proper Next.js 15 patterns
 */
export async function getProjectProfitabilityTrendsClient(
    projectId?: string,
    days: number = 30
): Promise<{
    dates: string[];
    profits: number[];
    costs: number[];
    revenues: number[];
}> {
    try {
        const searchParams = new URLSearchParams();

        if (projectId) {
            searchParams.append('projectId', projectId);
        }
        searchParams.append('days', days.toString());

        const url = `/api/project-profitability/trends?${searchParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching profitability trends:', error);
        return {
            dates: [],
            profits: [],
            costs: [],
            revenues: []
        };
    }
}
