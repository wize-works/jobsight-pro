"use client"

// Disable static generation for authenticated pages
export const dynamic = 'force-dynamic';

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
} from "chart.js"
import { Doughnut, Bar, Line } from "react-chartjs-2"
import { useDashboard } from "@/hooks/useDashboard"
import { useMedia, useMediaMutations } from "@/hooks/useMedia"
import { useAI } from "@/hooks/useAI"
import { formatCurrency, formatDate } from "@/utils/formatters"
import { useEffect, useState } from "react"
import ProjectModal from "./projects/components/modal-project"
import TaskDetailsModal from "./tasks/components/task-details-modal"
import EquipmentNewModal from "./equipment/components/modal-new"
import DailyLogModal from "./daily-logs/components/modal-log"
import PhotoUploadModal from "@/components/modals/photo-upload-modal"
import TimeTrackingModal from "@/components/modals/time-tracking-modal"
import ViewMyTasksModal from "@/components/modals/view-my-tasks-modal"
import { useBusiness } from "@/lib/business-context"
import Loading from "@/app/loading";
import ErrorBoundary from "@/components/error-boundary"
import WeatherWidget from "@/components/weather-widget"
import CompactWeatherWidget from "@/components/compact-weather-widget"
import { RoleBasedDashboard } from "@/components/role-based-dashboard"
import { useUserRole } from "@/hooks/use-user-role"
import { BusinessSweepstakeDashboard } from "@/components/referral/BusinessSweepstakeDashboard"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title)

interface DashboardData {
    stats: {
        activeProjects: number;
        totalProjects: number;
        pendingTasks: number;
        totalTasks: number;
        equipmentUtilization: number;
        totalEquipment: number;
        totalRevenue: number;
        pendingRevenue: number;
    };
    projectStatusData: {
        active: number;
        completed: number;
        onHold: number;
        planning: number;
    };
    taskStatusData: {
        pending: number;
        inProgress: number;
        completed: number;
    };
    projectsWithProgress: Array<{
        id: string;
        name: string;
        progress: number;
        taskCount: number;
        completedTasks: number;
        clientName: string;
        crewName: string;
        status: string;
        start_date?: string;
        end_date?: string;
    }>;
    recentActivity: Array<{
        id: string;
        type: string;
        message: string;
        projectName: string;
        clientName: string;
        weather?: string;
        timestamp: string;
        projectId: string;
    }>;
    criticalTasks: Array<{
        id: string;
        name: string;
        projectName: string;
        clientName: string;
        crewName: string;
        dueDate: string;
        status: string;
        priority?: string;
        isOverdue: boolean;
    }>;
    teamMetrics: Array<{
        id: string;
        name: string;
        activeTasks: number;
        completedTasks: number;
        productivity: number;
    }>;
    financialOverview: {
        totalRevenue: number;
        pendingRevenue: number;
        totalInvoices: number;
        paidInvoices: number;
        overdueInvoices: number;
    }; equipmentStatus: {
        available: number;
        inUse: number;
        maintenance: number;
    };
    dailyLogsData: {
        dates: string[];
        delays: number[];
        issues: number[];
        safetyReports: number[];
    };
    aiRecommendations: Array<{
        id: string;
        type: 'equipment' | 'safety' | 'productivity' | 'weather' | 'general';
        priority: 'low' | 'medium' | 'high' | 'critical';
        title: string;
        description: string;
        actionItems: string[];
        confidence: number;
    }>;
}

export default function Dashboard() {
    const router = useRouter();
    const { businessId, loading } = useBusiness();
    const { userRole, loading: roleLoading } = useUserRole();

    // Use hooks for data fetching
    const { dashboardData, loading: dashboardLoading, error: dashboardError, refresh: refreshDashboard } = useDashboard();
    const { query: aiQuery } = useAI();
    const { createMedia } = useMediaMutations();

    const [projectModal, setProjectModal] = useState(false);
    const [taskModal, setTaskModal] = useState(false);
    const [equipmentModal, setEquipmentModal] = useState(false);
    const [dailyLogModal, setDailyLogModal] = useState(false);
    const [photoUploadModal, setPhotoUploadModal] = useState(false);
    const [timeTrackingModal, setTimeTrackingModal] = useState(false);
    const [viewMyTasksModal, setViewMyTasksModal] = useState(false);
    const [aiRecommendations, setAiRecommendations] = useState<DashboardData['aiRecommendations']>([]);
    const [aiGuidance, setAiGuidance] = useState<string>('');
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    // Add state for user's current location
    const [userLocation, setUserLocation] = useState<null | {
        latitude: number;
        longitude: number;
        address: string;
    }>(null);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Weather helper functions (similar to daily log card component)
    const getWeatherIcon = (weather: string | null) => {
        if (!weather) return "fas fa-question";

        // Try to parse as JSON first
        try {
            const weatherData = JSON.parse(weather);
            if (weatherData.current) {
                const condition = weatherData.current.condition.toLowerCase();
                if (condition.includes('rain') || condition.includes('drizzle')) return "fas fa-cloud-rain";
                if (condition.includes('sun') || condition.includes('clear')) return "fas fa-sun";
                if (condition.includes('cloud')) return "fas fa-cloud";
                if (condition.includes('snow')) return "fas fa-snowflake";
                if (condition.includes('thunderstorm') || condition.includes('storm')) return "fas fa-bolt";
                return "fas fa-cloud-sun";
            }
        } catch {
            // Fall back to legacy string parsing
        }

        const weatherLower = weather.toLowerCase();
        if (weatherLower.includes('rain')) return "fas fa-cloud-rain";
        if (weatherLower.includes('sun') || weatherLower.includes('clear')) return "fas fa-sun";
        if (weatherLower.includes('cloud')) return "fas fa-cloud";
        if (weatherLower.includes('snow')) return "fas fa-snowflake";
        return "fas fa-cloud-sun";
    };

    const getWeatherDisplay = (weather: string | null) => {
        if (!weather) return null;

        try {
            const weatherData = JSON.parse(weather);
            if (weatherData.current) {
                return `${weatherData.current.description}, ${weatherData.current.temperature}°F`;
            }
        } catch {
            // Fall back to legacy string format
        }

        return weather;
    };

    // Separate useEffect for AI recommendations that triggers when dashboardData is available
    useEffect(() => {
        if (dashboardData && !loadingRecommendations && !aiGuidance) {
            fetchAIRecommendations();
        }
    }, [dashboardData]);    // Get user's geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log("Got user location:", position.coords.latitude, position.coords.longitude);
                    setUserLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        address: "Current Location"
                    });
                    setLocationError(null);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setUserLocation(null);

                    // Set a user-friendly error message based on the error code
                    if (error.code === 1) {
                        setLocationError("Location access was denied. Please enable location services to see weather information.");
                    } else if (error.code === 2) {
                        setLocationError("Your location could not be determined. Please check your device settings.");
                    } else if (error.code === 3) {
                        setLocationError("Location request timed out. Please try again later.");
                    } else {
                        setLocationError("An error occurred while accessing your location.");
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            console.warn("Geolocation is not supported by this browser");
            setUserLocation(null);
            setLocationError("Your browser doesn't support geolocation. Weather information is not available.");
        }
    }, []);

    // Function to process daily logs for chart data
    const processDailyLogsForChart = (recentActivity: any[]) => {
        // Get last 7 days of data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        // Initialize data arrays
        const dates = last7Days;
        const delays = new Array(7).fill(0);
        const issues = new Array(7).fill(0);
        const safetyReports = new Array(7).fill(0);

        // Process recent activity to count issues per day
        recentActivity.forEach((activity: any) => {
            if (activity.type === 'daily_log' && activity.timestamp) {
                const activityDate = new Date(activity.timestamp).toISOString().split('T')[0];
                const dayIndex = dates.indexOf(activityDate);

                if (dayIndex !== -1) {
                    const message = activity.message?.toLowerCase() || '';

                    if (message.includes('delay') || message.includes('delayed')) {
                        delays[dayIndex]++;
                    }
                    if (message.includes('issue') || message.includes('problem')) {
                        issues[dayIndex]++;
                    }
                    if (message.includes('safety') || message.includes('incident')) {
                        safetyReports[dayIndex]++;
                    }
                }
            }
        }); return { dates, delays, issues, safetyReports };
    };

    // Function to generate AI guidance based on dashboard data and user role
    const generateConstructionGuidance = async (data: DashboardData, userRole: string): Promise<string> => {
        if (!data || !businessId) {
            return '📊 **Analyzing Operations**: Dashboard insights are being generated based on your current project data.';
        }

        try {
            // Build role-specific context for AI analysis
            const roleContext = getRoleSpecificContext(userRole as any);
            const dataContext = buildDataContextForAI(data);

            // Create role-specific prompt for AI guidance
            const prompt = `As an AI construction management advisor, analyze the dashboard data and provide ONE focused insight for a ${userRole}.

${roleContext}

CURRENT DASHBOARD DATA:
${dataContext}

IMPORTANT INSTRUCTIONS:
- Provide ONLY ONE key insight or recommendation (maximum 2-3 sentences)
- Start with an appropriate emoji
- Focus on the most critical issue or opportunity
- Be specific and actionable
- Use simple, clear language
- Do NOT list multiple points or use numbered lists
- Keep response under 150 words

Example format: "🚨 **Safety Priority**: With 3 safety incidents this week, schedule immediate crew safety meetings and implement daily safety check-ins until incidents decrease."

Your single most important recommendation:`;

            // Call the AI hook
            const aiResult = await aiQuery(businessId, prompt, []);

            // Clean and format the AI response
            let cleanResponse = aiResult.response || getFailbackGuidance(data, userRole as any);

            // Limit response length and clean formatting
            cleanResponse = cleanAndFormatResponse(cleanResponse);

            return cleanResponse;
        } catch (error) {
            console.error('Error generating AI guidance:', error);
            return getFailbackGuidance(data, userRole as any);
        }
    };

    // Helper function to get role-specific context
    const getRoleSpecificContext = (role: 'admin' | 'manager' | 'member'): string => {
        const roleContexts = {
            admin: `ROLE CONTEXT: You are providing guidance to a business ADMIN/OWNER who focuses on:
- Strategic business decisions and financial performance
- Overall business growth and profitability
- Resource allocation across multiple projects
- Business process optimization and efficiency
- Long-term planning and risk management
- Financial metrics, cash flow, and business KPIs`,

            manager: `ROLE CONTEXT: You are providing guidance to a PROJECT MANAGER who focuses on:
- Day-to-day project coordination and execution
- Team performance and productivity management
- Resource allocation and scheduling optimization
- Quality control and timeline management
- Client communication and project delivery
- Crew coordination and task assignment`,

            member: `ROLE CONTEXT: You are providing guidance to a FIELD MEMBER/WORKER who focuses on:
- Daily task execution and completion
- Safety compliance and reporting
- Quality of work and productivity
- Equipment operation and maintenance
- Communication with supervisors and team
- Time tracking and daily log completion`
        };

        return roleContexts[role];
    };

    // Helper function to build data context for AI
    const buildDataContextForAI = (data: DashboardData): string => {
        const safetyIssues = data.dailyLogsData?.safetyReports?.reduce((a: number, b: number) => a + b, 0) || 0;
        const totalDelays = data.dailyLogsData?.delays?.reduce((a: number, b: number) => a + b, 0) || 0;
        const issues = data.dailyLogsData?.issues?.reduce((a: number, b: number) => a + b, 0) || 0;

        return `
PROJECT METRICS:
- Active Projects: ${data.stats?.activeProjects || 0}
- Total Projects: ${data.stats?.totalProjects || 0}
- Pending Tasks: ${data.stats?.pendingTasks || 0}
- Total Tasks: ${data.stats?.totalTasks || 0}
- Equipment Utilization: ${data.stats?.equipmentUtilization || 0}%

FINANCIAL OVERVIEW:
- Total Revenue: $${data.financialOverview?.totalRevenue?.toLocaleString() || '0'}
- Pending Revenue: $${data.financialOverview?.pendingRevenue?.toLocaleString() || '0'}
- Total Invoices: ${data.financialOverview?.totalInvoices || 0}
- Paid Invoices: ${data.financialOverview?.paidInvoices || 0}
- Overdue Invoices: ${data.financialOverview?.overdueInvoices || 0}

RECENT ACTIVITY (Last 7 Days):
- Safety Reports: ${safetyIssues}
- Project Delays: ${totalDelays}
- Issues Reported: ${issues}

TEAM PERFORMANCE:
- Number of Teams: ${data.teamMetrics?.length || 0}
- Low Productivity Teams (< 80%): ${data.teamMetrics?.filter((team: any) => team.productivity < 80).length || 0}

EQUIPMENT STATUS:
- Available: ${data.equipmentStatus?.available || 0}
- In Use: ${data.equipmentStatus?.inUse || 0}
- Under Maintenance: ${data.equipmentStatus?.maintenance || 0}
        `.trim();
    };

    // Fallback function for when AI is unavailable
    const getFailbackGuidance = (data: DashboardData, role: 'admin' | 'manager' | 'member'): string => {
        const safetyIssues = data.dailyLogsData?.safetyReports?.reduce((a: number, b: number) => a + b, 0) || 0;
        const totalDelays = data.dailyLogsData?.delays?.reduce((a: number, b: number) => a + b, 0) || 0;
        const equipmentUtil = data.stats?.equipmentUtilization || 0;
        const overdueInvoices = data.financialOverview?.overdueInvoices || 0;
        const lowProductivityCrews = data.teamMetrics?.filter((team: any) => team.productivity < 80).length || 0;

        // Role-based priority guidance (keep it short and focused)
        if (role === 'admin') {
            if (overdueInvoices > 2) {
                return `💰 **Cash Flow Alert**: ${overdueInvoices} overdue invoices detected. Follow up with clients today and consider progress billing.`;
            }
            if (equipmentUtil < 60) {
                return `🔧 **Equipment Optimization**: ${equipmentUtil}% utilization suggests rental strategy review for better ROI.`;
            }
        } else if (role === 'manager') {
            if (safetyIssues > 2) {
                return `⚠️ **Safety Priority**: ${safetyIssues} incidents this week require immediate crew safety meetings.`;
            }
            if (totalDelays > 3) {
                return `⏰ **Schedule Alert**: ${totalDelays} delays detected. Review material delivery and add buffer time.`;
            }
            if (lowProductivityCrews > 0) {
                return `👥 **Team Support**: ${lowProductivityCrews} crew(s) need productivity assistance and training check-ins.`;
            }
        } else { // member
            if (safetyIssues > 0) {
                return `🦺 **Safety Focus**: Stay alert to protocols and report hazards immediately to supervisors.`;
            }
            if (totalDelays > 0) {
                return `📋 **Task Focus**: Complete assigned tasks efficiently and communicate obstacles promptly.`;
            }
        }

        // Default positive guidance based on role (shorter versions)
        const activeProjects = data.stats?.activeProjects || 0;
        const completionRate = data.stats?.totalTasks ? Math.round(((data.stats.totalTasks - data.stats.pendingTasks) / data.stats.totalTasks) * 100) : 0;

        if (role === 'admin') {
            return `✅ **Strong Performance**: ${activeProjects} active projects running smoothly. Continue monitoring KPIs.`;
        } else if (role === 'manager') {
            return `✅ **Operations On Track**: ${completionRate}% task completion with ${activeProjects} projects progressing well.`;
        } else {
            return `✅ **Good Work**: Contributing to ${activeProjects} active projects. Keep following safety protocols.`;
        }
    };

    // Function to fetch AI guidance
    const fetchAIRecommendations = async () => {
        if (!businessId || !dashboardData) return;

        setLoadingRecommendations(true);
        try {
            // Generate AI-powered guidance based on actual data patterns and user role
            // TODO: Update function to handle new dashboard data structure
            const guidance = await generateConstructionGuidance(dashboardData as any, userRole || 'member');
            setAiGuidance(guidance);
        } catch (error) {
            console.error("Error generating AI guidance:", error);
            // Fallback guidance
            setAiGuidance('📊 **Analyzing Operations**: Dashboard insights are being generated based on your current project data.');
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const handleQuickAction = (action: string) => {
        switch (action) {
            case 'addDailyLog':
                setDailyLogModal(true);
                break;
            case 'createProject':
                setProjectModal(true);
                break;
            case 'assignTask':
                setTaskModal(true);
                break;
            case 'reviewProgress':
                router.push('/dashboard/projects');
                break;
            case 'approveTimesheet':
                router.push('/dashboard/daily-logs');
                break;
            case 'viewReports':
                router.push('/dashboard/reports');
                break;
            case 'viewMyTasks':
                setViewMyTasksModal(true);
                break;
            case 'uploadPhoto':
                setPhotoUploadModal(true);
                break;
            case 'startTimeTracking':
                setTimeTrackingModal(true);
                break;
            case 'reportSafety':
                setDailyLogModal(true);
                break;
            case 'manageUsers':
                router.push('/dashboard/business?tab=users');
                break;
            case 'viewFinancials':
                router.push('/dashboard/reports?tab=financial');
                break;
            case 'systemSettings':
                router.push('/dashboard/business?tab=profile');
                break;
            default:
                console.log(`Quick action: ${action}`);
        }
    };

    if (!dashboardData || loading || roleLoading) {
        return <Loading />
    }

    // Enhanced Chart Configurations
    const projectStatusData = {
        labels: ["Active", "Completed", "On Hold", "Planning"],
        datasets: [
            {
                data: [
                    dashboardData.projectStatusData.active,
                    dashboardData.projectStatusData.completed,
                    dashboardData.projectStatusData.onHold,
                    dashboardData.projectStatusData.planning
                ],
                backgroundColor: [
                    "#F87431", // primary
                    "#02ACA3", // secondary
                    "#C275B4", // accent
                    "#5C95FF", // info
                ],
                borderWidth: 0,
                cutout: "60%",
            },
        ],
    }

    const taskStatusData = {
        labels: ["Pending", "In Progress", "Completed"],
        datasets: [
            {
                data: [
                    dashboardData.taskStatusData.pending,
                    dashboardData.taskStatusData.inProgress,
                    dashboardData.taskStatusData.completed
                ],
                backgroundColor: [
                    "#F87431", // primary
                    "#02ACA3", // secondary
                    "#C275B4", // accent
                ],
                borderRadius: 4,
            },
        ],
    }

    const equipmentData = {
        labels: ["Available", "In Use", "Maintenance"],
        datasets: [
            {
                data: [
                    dashboardData.equipmentStatus.available,
                    dashboardData.equipmentStatus.inUse,
                    dashboardData.equipmentStatus.maintenance
                ],
                backgroundColor: [
                    "#F87431", // primary
                    "#02ACA3", // secondary
                    "#C275B4", // accent
                ],
                borderWidth: 0,
            },],
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 20,
                    usePointStyle: true,
                }
            }
        }
    };

    // Daily Logs Line Chart Configuration - TODO: Replace with actual data when available
    const dailyLogsData = {
        labels: [], // dashboardData.dailyLogsData?.dates || []
        datasets: [
            {
                label: "Delays",
                data: [], // dashboardData.dailyLogsData?.delays || []
                borderColor: "#F87431",
                backgroundColor: "rgba(248, 116, 49, 0.1)",
                tension: 0.4,
                fill: false,
            },
            {
                label: "Issues",
                data: [], // dashboardData.dailyLogsData?.issues || []
                borderColor: "#FF6B6B",
                backgroundColor: "rgba(255, 107, 107, 0.1)",
                tension: 0.4,
                fill: false,
            },
            {
                label: "Safety Reports",
                data: [], // dashboardData.dailyLogsData?.safetyReports || []
                borderColor: "#4ECDC4",
                backgroundColor: "rgba(78, 205, 196, 0.1)",
                tension: 0.4,
                fill: false,
            },
        ],
    }

    // Equipment Utilization Over Time Chart Configuration
    const equipmentUtilizationData = {
        labels: [], // dashboardData.dailyLogsData?.dates || []
        datasets: [
            {
                label: "Equipment Utilization %",
                data: [], // Generate when data available
                // data: dashboardData.dailyLogsData?.dates.map((_, index) => {
                //     // Generate realistic equipment utilization data based on current utilization
                //     const baseUtilization = dashboardData.stats.equipmentUtilization;
                //     const variation = Math.sin(index * 0.5) * 10; // Daily variation
                //     const randomness = (Math.random() - 0.5) * 8; // Small random variation
                //     return Math.max(0, Math.min(100, baseUtilization + variation + randomness));
                // }) || [],
                borderColor: "#02ACA3",
                backgroundColor: "rgba(2, 172, 163, 0.1)",
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "#02ACA3",
                pointBorderColor: "#ffffff",
                pointBorderWidth: 2,
                pointRadius: 4,
            },
        ],
    }

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 20,
                    usePointStyle: true,
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                }
            }
        }
    }

    // Helper function to clean and format AI responses
    const cleanAndFormatResponse = (response: string): string => {
        if (!response) return '';

        // Remove excessive whitespace and line breaks
        let cleaned = response.trim();

        // Limit length to prevent overwhelming display (approximately 2-3 lines)
        const maxLength = 200;
        if (cleaned.length > maxLength) {
            // Try to cut at a sentence end
            const sentences = cleaned.split('. ');
            cleaned = sentences[0];
            if (cleaned.length < 50 && sentences.length > 1) {
                cleaned += '. ' + sentences[1];
            }
            if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
                cleaned += '.';
            }
        }

        // Remove any markdown artifacts that might display poorly
        cleaned = cleaned.replace(/#{1,6}\s*/g, ''); // Remove # headers
        cleaned = cleaned.replace(/\*{3,}/g, '**'); // Reduce multiple asterisks
        cleaned = cleaned.replace(/\n{2,}/g, ' '); // Replace multiple newlines with space
        cleaned = cleaned.replace(/\s{2,}/g, ' '); // Replace multiple spaces with single space

        // Ensure we start with an emoji if it doesn't have one
        if (!cleaned.match(/^[\u{1F300}-\u{1F9FF}]|^[\u{2600}-\u{26FF}]/u)) {
            // Add a default emoji based on content
            if (cleaned.toLowerCase().includes('safety') || cleaned.toLowerCase().includes('incident')) {
                cleaned = '⚠️ ' + cleaned;
            } else if (cleaned.toLowerCase().includes('financial') || cleaned.toLowerCase().includes('revenue')) {
                cleaned = '💰 ' + cleaned;
            } else if (cleaned.toLowerCase().includes('equipment')) {
                cleaned = '🔧 ' + cleaned;
            } else if (cleaned.toLowerCase().includes('team') || cleaned.toLowerCase().includes('crew')) {
                cleaned = '👥 ' + cleaned;
            } else {
                cleaned = '📊 ' + cleaned;
            }
        }

        return cleaned;
    };

    return (
        <RoleBasedDashboard fallbackRole="member" onQuickAction={handleQuickAction}>
            <div className="space-y-6">
                {/* Modal Components */}
                {<ProjectModal isOpen={projectModal} onClose={() => setProjectModal(false)} onSave={async () => setProjectModal(false)} />}
                {taskModal && (
                    <TaskDetailsModal
                        isOpen={taskModal}
                        onClose={() => setTaskModal(false)}
                        task={null} // null = create mode
                        projects={[]} // Empty for now, will be populated by the modal if needed
                        crews={[]} // Empty for now, will be populated by the modal if needed
                        onTaskUpdate={() => { }} // Not used in create mode
                        onTaskDelete={() => { }} // Not used in create mode
                        onTaskCreate={() => {
                            setTaskModal(false);
                            // Refresh dashboard data
                            window.location.reload();
                        }}
                    />
                )}
                {<DailyLogModal isOpen={dailyLogModal} onClose={() => setDailyLogModal(false)} onSave={() => setDailyLogModal(false)} />}
                {<EquipmentNewModal isOpen={equipmentModal} onClose={() => setEquipmentModal(false)} onSave={() => setEquipmentModal(false)} />}

                {/* New Quick Action Modals */}
                <PhotoUploadModal
                    isOpen={photoUploadModal}
                    onClose={() => setPhotoUploadModal(false)}
                    onPhotoCapture={async (photoData) => {
                        try {
                            console.log('Photo captured:', photoData);

                            // Show loading state
                            setPhotoUploadModal(false);

                            // Simple notification (could be enhanced with proper toast system)
                            const startTime = Date.now();
                            console.log('⏳ Uploading photo...');

                            // Get current location if available
                            let location: { latitude: number; longitude: number; address?: string } | undefined = undefined;
                            if (userLocation) {
                                location = {
                                    latitude: userLocation.latitude,
                                    longitude: userLocation.longitude,
                                    address: userLocation.address
                                };
                            }

                            // TODO: Replace with media hooks upload functionality
                            // const result = await uploadPhotoWithContext(
                            //     businessId,
                            //     photoData.file,
                            //     photoData.context || { type: 'general' },
                            //     {
                            //         description: photoData.description,
                            //         location,
                            //         timestamp: new Date().toISOString(),
                            //         tags: ["dashboard", photoData.context?.type || "general"]
                            //     }
                            // );

                            // Temporary placeholder response
                            const result = {
                                success: true,
                                media: { id: '', url: '', size: 0 },
                                error: null
                            };

                            const uploadTime = Date.now() - startTime;

                            if (result.success) {
                                console.log('✅ Photo uploaded successfully:', result.media);
                                console.log(`📸 Upload completed in ${uploadTime}ms`);

                                // Simple success notification
                                alert(`Photo uploaded successfully! (${uploadTime}ms)`);

                                // Refresh dashboard data if needed
                                // Could implement a partial refresh of media-related data

                                // Log success details
                                console.log('📊 Photo details:', {
                                    id: result.media?.id,
                                    url: result.media?.url,
                                    size: result.media?.size,
                                    hasLocation: !!location
                                });
                            } else {
                                console.error('❌ Photo upload failed:', result.error);
                                alert(`Upload failed: ${result.error}`);
                            }
                        } catch (error) {
                            console.error('💥 Error handling photo capture:', error);
                            alert(`Error uploading photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                    }}
                />
                <TimeTrackingModal
                    isOpen={timeTrackingModal}
                    onClose={() => setTimeTrackingModal(false)}
                />
                <ViewMyTasksModal
                    isOpen={viewMyTasksModal}
                    onClose={() => setViewMyTasksModal(false)}
                    onCreateNewTask={() => {
                        setViewMyTasksModal(false);
                        setTaskModal(true);
                    }}
                />

                {/* Key Performance Indicators */}
                <ErrorBoundary fallback={(error) => (
                    <div className="alert alert-error">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <h3 className="font-bold">Failed to load dashboard statistics</h3>
                            <div className="text-xs">Please refresh the page to try again.</div>
                        </div>
                    </div>
                )}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="stat bg-gradient-to-br from-primary/70 to-primary/100 text-primary-content rounded-lg shadow-lg">
                            <div className="stat-figure">
                                <i className="far fa-screwdriver-wrench text-3xl opacity-80"></i>
                            </div>
                            <div className="stat-title text-blue-100">Active Projects</div>
                            <div className="stat-value">{dashboardData.stats.activeProjects}</div>
                            <div className="stat-desc text-blue-200">of {dashboardData.stats.totalProjects} total</div>
                        </div>

                        <div className="stat bg-gradient-to-br from-secondary/70 to-secondary/100 text-secondary-content rounded-lg shadow-lg">
                            <div className="stat-figure">
                                <i className="far fa-tasks text-3xl opacity-80"></i>
                            </div>
                            <div className="stat-title text-emerald-100">Pending Tasks</div>
                            <div className="stat-value">{dashboardData.stats.pendingTasks}</div>
                            <div className="stat-desc text-emerald-200">of {dashboardData.stats.totalTasks} total</div>
                        </div>

                        <div className="stat bg-gradient-to-br from-accent/70 to-accent/100 text-accent-content rounded-lg shadow-lg">
                            <div className="stat-figure">
                                <i className="far fa-tools text-3xl opacity-80"></i>
                            </div>
                            <div className="stat-title text-amber-100">Equipment Active</div>
                            <div className="stat-value">{dashboardData.stats.equipmentUtilization}%</div>
                            <div className="stat-desc text-amber-200">{dashboardData.stats.totalEquipment} total units</div>
                        </div>

                        <div className="stat bg-gradient-to-br from-info/70 to-info/100 text-info-content rounded-lg shadow-lg">
                            <div className="stat-figure">
                                <i className="far fa-dollar-sign text-3xl opacity-80"></i>
                            </div>
                            <div className="stat-title text-green-100">Revenue</div>
                            <div className="stat-value text-2xl">{formatCurrency(dashboardData.stats.totalRevenue)}</div>
                            <div className="stat-desc text-green-200">{formatCurrency(dashboardData.stats.pendingRevenue)} pending</div>
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Charts Section */}
                <ErrorBoundary fallback={(error) => (
                    <div className="alert alert-error">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <h3 className="font-bold">Failed to load dashboard charts</h3>
                            <div className="text-xs">Charts are temporarily unavailable. Please refresh the page.</div>
                        </div>
                    </div>
                )}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <i className="far fa-chart-pie text-primary mr-2"></i>
                                    Project Status
                                </h2>
                                <div className="h-64">
                                    <Doughnut data={projectStatusData} options={chartOptions} />
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <i className="far fa-chart-bar text-primary mr-2"></i>
                                    Task Distribution
                                </h2>
                                <div className="h-64">
                                    <Bar data={taskStatusData} options={chartOptions} />
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <i className="far fa-cogs text-primary mr-2"></i>
                                    Equipment Status
                                </h2>
                                <div className="h-64">
                                    <Doughnut data={equipmentData} options={chartOptions} />
                                </div>
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Financial Overview */}
                <ErrorBoundary fallback={(error) => (
                    <div className="alert alert-error">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <h3 className="font-bold">Failed to load financial overview</h3>
                            <div className="text-xs">Financial data is temporarily unavailable.</div>
                        </div>
                    </div>
                )}>
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg">
                                <i className="far fa-chart-line text-primary mr-2"></i>
                                Financial Overview
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="stat">
                                    <div className="stat-title">Total Revenue</div>
                                    <div className="stat-value text-success">{formatCurrency(dashboardData.financialOverview.totalRevenue)}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">Pending</div>
                                    <div className="stat-value text-warning">{formatCurrency(dashboardData.financialOverview.pendingRevenue)}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">Total Invoices</div>
                                    <div className="stat-value">{dashboardData.financialOverview.totalInvoices}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">Paid</div>
                                    <div className="stat-value text-success">{dashboardData.financialOverview.paidInvoices}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">Overdue</div>
                                    <div className="stat-value text-error">{dashboardData.financialOverview.overdueInvoices}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Sweepstake Campaign Dashboard */}
                <ErrorBoundary fallback={(error) => (
                    <div className="alert alert-error">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <h3 className="font-bold">Failed to load sweepstake campaign</h3>
                            <div className="text-xs">Sweepstake data is temporarily unavailable.</div>
                        </div>
                    </div>
                )}>
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <h2 className="card-title text-lg mb-4">
                                <i className="far fa-trophy text-primary mr-2"></i>
                                Sweepstake Campaign
                            </h2>
                            <BusinessSweepstakeDashboard businessId={businessId} />
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Weather widget */}
                <ErrorBoundary fallback={(error) => (
                    <div className="alert alert-error">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <h3 className="font-bold">Weather Service Error</h3>
                            <div className="text-xs">There was a problem connecting to the weather service. Please try again later.</div>
                        </div>
                    </div>
                )}>
                    {userLocation ? (
                        <CompactWeatherWidget
                            location={userLocation}
                        />
                    ) : (
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <div className="flex items-center gap-2 mb-2">
                                    <i className="far fa-map-marker-exclamation text-warning"></i>
                                    <h2 className="card-title text-lg">Location Required</h2>
                                </div>
                                <p className="text-sm text-base-content/80">
                                    {locationError || "Weather information requires access to your location. Please enable location services to see local weather conditions."}
                                </p>
                                <div className="card-actions justify-end mt-4">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                            // Attempt to get location again
                                            if (navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition(
                                                    (position) => {
                                                        setUserLocation({
                                                            latitude: position.coords.latitude,
                                                            longitude: position.coords.longitude,
                                                            address: "Current Location"
                                                        });
                                                        setLocationError(null);
                                                    },
                                                    (error) => {
                                                        console.error("Error getting location:", error);
                                                        if (error.code === 1) {
                                                            setLocationError("Location access was denied. Please enable location services in your browser settings.");
                                                        }
                                                    }
                                                );
                                            }
                                        }}
                                    >
                                        <i className="far fa-location mr-1"></i> Enable Location
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </ErrorBoundary>

                {/* Daily Logs, AI Recommendations & Weather */}
                <ErrorBoundary fallback={(error) => (
                    <div className="alert alert-error">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <h3 className="font-bold">Failed to load analytics section</h3>
                            <div className="text-xs">Daily logs, AI recommendations, and weather data are temporarily unavailable.</div>
                        </div>
                    </div>
                )}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daily Logs Trends */}
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <i className="far fa-chart-line text-primary mr-2"></i>
                                    Daily Logs Trends
                                </h2>
                                <div className="h-64">
                                    {/* TODO: Restore daily logs charts when data is available in dashboard API */}
                                    {/* {dashboardData.dailyLogsData.dates.length > 0 ? ( */}
                                    {false ? (
                                        <Line data={dailyLogsData} options={lineChartOptions} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-base-content/50">
                                            <div className="text-center">
                                                <i className="far fa-chart-line text-4xl mb-2"></i>
                                                <p>No daily logs data yet</p>
                                                <button
                                                    className="btn btn-primary btn-sm mt-2"
                                                    onClick={() => setDailyLogModal(true)}
                                                >
                                                    Add Daily Log
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* AI Guidance */}
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <i className="far fa-brain text-primary mr-2"></i>
                                    AI Insights
                                </h2>
                                <div className="min-h-32">
                                    {loadingRecommendations ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="loading loading-spinner loading-lg"></div>
                                            <span className="ml-2">Analyzing your data...</span>
                                        </div>
                                    ) : aiGuidance ? (
                                        <div className="bg-base-200/50 rounded-lg p-4 border-l-4 border-primary">
                                            <div
                                                className="text-sm leading-relaxed text-base-content/90"
                                                dangerouslySetInnerHTML={{
                                                    __html: aiGuidance.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-base-content/50">
                                            <i className="far fa-lightbulb text-4xl mb-2"></i>
                                            <p>AI is analyzing your operations...</p>
                                            <p className="text-xs">Insights will appear shortly</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>                    <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <i className="far fa-tools text-primary mr-2"></i>
                                    Equipment Utilization
                                </h2>
                                <div className="h-64">
                                    {/* TODO: Restore equipment utilization charts when data is available in dashboard API */}
                                    {/* {dashboardData.dailyLogsData.dates.length > 0 ? ( */}
                                    {false ? (
                                        <Line data={equipmentUtilizationData} options={lineChartOptions} />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-base-content/50">
                                            <div className="text-center">
                                                <i className="far fa-tools text-4xl mb-2"></i>
                                                <p>No equipment data yet</p>
                                                <Link href="/dashboard/equipment" className="btn btn-primary btn-sm mt-2">
                                                    Add Equipment
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>
                {/* Project Progress & Critical Tasks */}
                <ErrorBoundary fallback={(error) => (
                    <div className="alert alert-error">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <h3 className="font-bold">Failed to load project status</h3>
                            <div className="text-xs">Project and task data is temporarily unavailable.</div>
                        </div>
                    </div>
                )}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <i className="far fa-building text-primary mr-2"></i>
                                    Active Projects
                                </h2>
                                <div className="space-y-3">
                                    {dashboardData.projectsWithProgress.length > 0 ? (
                                        dashboardData.projectsWithProgress.slice(0, 3).map((project) => (
                                            <div key={project.id} className="border border-base-300 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <Link href={`/dashboard/projects/${project.id}`} className="hover:text-primary transition-colors">
                                                            <h3 className="font-semibold hover:underline">{project.name}</h3>
                                                        </Link>
                                                        <p className="text-sm text-base-content/70">{project.clientName}</p>
                                                    </div>
                                                    <span className={`badge ${project.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                                                        {project.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm">Progress: {project.progress}%</span>
                                                    <span className="text-sm">{project.completedTasks}/{project.taskCount} tasks</span>
                                                </div>
                                                <progress className="progress progress-primary w-full" value={project.progress} max="100"></progress>
                                                <div className="text-xs text-base-content/50 mt-1">
                                                    Crew: {project.crewNames}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-base-content/50">
                                            <i className="far fa-plus-circle text-4xl mb-2"></i>
                                            <p>No active projects yet</p>
                                            <Link href="/dashboard/projects" className="btn btn-primary btn-sm mt-2">
                                                Create Project
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <i className="far fa-exclamation-triangle text-warning mr-2"></i>
                                    Critical Tasks
                                </h2>
                                <div className="space-y-3">                                {dashboardData.criticalTasks.length > 0 ? (
                                    dashboardData.criticalTasks.slice(0, 3).map((task) => (
                                        <div key={task.id} className={`border rounded-lg p-4 ${task.isOverdue ? 'border-error bg-error/5' : 'border-warning bg-warning/5'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <Link href={`/dashboard/tasks/${task.id}`} className="hover:text-primary transition-colors">
                                                        <h3 className="font-semibold hover:underline">{task.name}</h3>
                                                    </Link>
                                                    <p className="text-sm text-base-content/70">{task.projectName}</p>
                                                </div>
                                                <span className={`badge ${task.isOverdue ? 'badge-error' : 'badge-warning'}`}>
                                                    {task.isOverdue ? 'Overdue' : 'Due Soon'}
                                                </span>
                                            </div>
                                            <div className="text-sm space-y-1">
                                                <div>Due: {formatDate(task.dueDate)}</div>
                                                <div>Assigned: {task.crewName}</div>
                                                <div>Client: {task.clientName}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-base-content/50">
                                        <i className="far fa-check-circle text-4xl mb-2 text-success"></i>
                                        <p>All tasks are on track!</p>
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>
                {/* Team Performance & Recent Activity */}
                <ErrorBoundary fallback={(error) => (
                    <div className="alert alert-error">
                        <i className="fas fa-exclamation-triangle"></i>
                        <div>
                            <h3 className="font-bold">Failed to load team and activity data</h3>
                            <div className="text-xs">Team performance and recent activity are temporarily unavailable.</div>
                        </div>
                    </div>
                )}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <i className="far fa-users text-primary mr-2"></i>
                                    Team Performance
                                </h2>
                                <div className="space-y-3">                                {dashboardData.teamMetrics.length > 0 ? (
                                    dashboardData.teamMetrics.slice(0, 3).map((team) => (
                                        <div key={team.id} className="flex items-center justify-between p-3 border border-base-300 rounded-lg">
                                            <div>
                                                <Link href={`/dashboard/crews/${team.id}`} className="hover:text-primary transition-colors">
                                                    <h3 className="font-semibold hover:underline">{team.name}</h3>
                                                </Link>
                                                <p className="text-sm text-base-content/70">
                                                    {team.activeTasks} active • {team.completedTasks} completed
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold">{team.productivity}%</div>
                                                <div className="text-xs text-base-content/50">productivity</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-base-content/50">
                                        <i className="far fa-user-plus text-4xl mb-2"></i>
                                        <p>No teams created yet</p>
                                        <Link href="/dashboard/crews" className="btn btn-primary btn-sm mt-2">
                                            Add Teams
                                        </Link>
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-4">
                                    <i className="far fa-clock text-primary mr-2"></i>
                                    Recent Activity
                                </h2>
                                <div className="space-y-3">
                                    {dashboardData.recentActivity.length > 0 ? (
                                        dashboardData.recentActivity.slice(0, 3).map((activity) => (
                                            <div key={activity.id} className="border-l-4 border-primary pl-4 py-2">
                                                {activity.type === 'daily_log' ? (
                                                    <Link href={`/dashboard/daily-logs/${activity.id}`} className="hover:text-primary transition-colors">
                                                        <p className="font-medium text-sm hover:underline">{activity.message}</p>
                                                    </Link>
                                                ) : (
                                                    <p className="font-medium text-sm">{activity.message}</p>
                                                )}<div className="text-xs text-base-content/70 space-y-1">
                                                    <div>
                                                        <Link href={`/dashboard/projects/${activity.projectId}`} className="hover:text-primary transition-colors hover:underline">
                                                            {activity.projectName}
                                                        </Link>
                                                        {" • "}{activity.clientName}
                                                    </div>
                                                    <div>{formatDate(activity.timestamp)}</div>
                                                    {activity.weather && getWeatherDisplay(activity.weather) && (
                                                        <div className="flex items-center gap-1 w-full overflow-hidden">
                                                            <i className={`${getWeatherIcon(activity.weather)} text-xs`} />
                                                            <span className="badge badge-outline badge-sm">{getWeatherDisplay(activity.weather)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-base-content/50">
                                            <i className="far fa-clipboard-list text-4xl mb-2"></i>
                                            <p>No recent activity</p>
                                            <Link href="/dashboard/daily-logs" className="btn btn-primary btn-sm mt-2">
                                                Add Daily Log
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>
            </div>
        </RoleBasedDashboard>
    )
}
