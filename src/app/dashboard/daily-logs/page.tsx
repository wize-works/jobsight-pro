import DailyLogsList from "./components/list";
import { getDailyLogsWithDetails } from "@/app/actions/daily-logs";
import { getCrews } from "@/app/actions/crews";
import { getProjects } from "@/app/actions/projects";
import { getEquipments } from "@/app/actions/equipments";
import { getCrewMembers } from "@/app/actions/crew-members";

export default async function DailyLogs() {
    // Fetch data on the server
    const [logs, crews, crewMembers, projects, equipments] = await Promise.all([
        getDailyLogsWithDetails(),
        getCrews(),
        getCrewMembers(),
        getProjects(),
        getEquipments(),
    ]);

    return (
        <div className="container mx-auto">
            <DailyLogsList initialLogs={logs} initialCrews={crews} initialCrewMembers={crewMembers} initialProjects={projects} initialEquipments={equipments} />
        </div>
    );
}