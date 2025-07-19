import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { createServerClient } from '@/lib/supabase';

/**
 * GET /api/projects/profitability
 * Get project profitability data for analytics
 */
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
        }

        // Get user's business
        const { data: profile } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('user_id', user.id)
            .single();

        if (!profile?.business_id) {
            return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const clientId = searchParams.get('clientId');
        const riskLevel = searchParams.get('riskLevel');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build query for projects
        let projectsQuery = supabase
            .from('projects')
            .select(`
                id,
                name,
                status,
                budget,
                start_date,
                expected_completion_date,
                created_at,
                client_id,
                project_expenses!inner(
                    amount,
                    date,
                    category
                ),
                project_revenues!inner(
                    amount,
                    date,
                    type
                )
            `)
            .eq('business_id', profile.business_id);

        // Apply filters
        if (status) {
            projectsQuery = projectsQuery.eq('status', status);
        }
        if (clientId) {
            projectsQuery = projectsQuery.eq('client_id', clientId);
        }
        if (startDate && endDate) {
            projectsQuery = projectsQuery
                .gte('start_date', startDate)
                .lte('start_date', endDate);
        }

        const { data: projects, error: projectsError } = await projectsQuery;

        if (projectsError) {
            console.error('Error fetching projects:', projectsError);
            return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 });
        }

        // Calculate profitability for each project
        const projectProfitability = projects?.map(project => {
            const totalRevenue = project.project_revenues?.reduce((sum, rev) => sum + rev.amount, 0) || 0;
            const totalExpenses = project.project_expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
            const profit = totalRevenue - totalExpenses;
            const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

            // Calculate risk level based on budget vs actual costs
            let calculatedRiskLevel = 'low';
            if (project.budget > 0) {
                const budgetUtilization = totalExpenses / project.budget;
                if (budgetUtilization > 0.9) calculatedRiskLevel = 'high';
                else if (budgetUtilization > 0.7) calculatedRiskLevel = 'medium';
            }

            return {
                id: project.id,
                name: project.name,
                status: project.status,
                budget: project.budget,
                totalRevenue,
                totalExpenses,
                profit,
                profitMargin,
                riskLevel: calculatedRiskLevel,
                startDate: project.start_date,
                expectedCompletion: project.expected_completion_date
            };
        }) || [];

        // Apply risk level filter after calculation
        const filteredProjects = riskLevel
            ? projectProfitability.filter(p => p.riskLevel === riskLevel)
            : projectProfitability;

        // Calculate summary statistics
        const totalProjects = filteredProjects.length;
        const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.totalRevenue, 0);
        const totalExpenses = filteredProjects.reduce((sum, p) => sum + p.totalExpenses, 0);
        const totalProfit = totalRevenue - totalExpenses;
        const averageProfitMargin = totalProjects > 0
            ? filteredProjects.reduce((sum, p) => sum + p.profitMargin, 0) / totalProjects
            : 0;

        const profitableProjects = filteredProjects.filter(p => p.profit > 0).length;
        const profitabilityRate = totalProjects > 0 ? (profitableProjects / totalProjects) * 100 : 0;

        const summary = {
            totalProjects,
            totalRevenue,
            totalExpenses,
            totalProfit,
            averageProfitMargin,
            profitabilityRate,
            profitableProjects,
            unprofitableProjects: totalProjects - profitableProjects
        };

        const data = {
            projects: filteredProjects,
            summary
        };

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (error) {
        console.error('Error in GET /api/projects/profitability:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
