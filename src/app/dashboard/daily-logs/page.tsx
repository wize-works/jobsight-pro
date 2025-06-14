import { getDailyLogsWithDetails } from "@/app/actions/daily-logs";
import { getCrews } from "@/app/actions/crews";
import { getProjects } from "@/app/actions/projects";
import { getEquipments } from "@/app/actions/equipments";
import { getCrewMembers } from "@/app/actions/crew-members";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import DailyLogsList from "./components/list";


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
            <DailyLogsList logs={logs} crews={crews} crewMembers={crewMembers} projects={projects} equipments={equipments} />
        </div>
    );
}