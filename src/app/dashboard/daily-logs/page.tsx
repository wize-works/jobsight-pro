import DailyLogsList from "./components/list";
import { getDailyLogsWithDetails } from "@/app/actions/daily-logs";
import { getCrews } from "@/app/actions/crews";
import { getProjects } from "@/app/actions/projects";

export default async function DailyLogs() {
    // Fetch data on the server
    const [logs, crews, projects] = await Promise.all([
        getDailyLogsWithDetails(),
        getCrews(),
        getProjects()
    ]);

    return (
        <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Daily Logs</h1>
                    <p className="text-sm text-base-content/50">Manage your daily logs efficiently</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button className="btn btn-primary">
                        <i className="fal fa-plus fa-fw mr-2"></i>
                        New Log
                    </button>
                </div>
            </div>

            <DailyLogsList initialLogs={logs} initialCrews={crews} initialProjects={projects} />
        </div>
    );
}