import { getDailyLogsWithDetails } from "@/app/actions/daily-logs";
import { getCrews } from "@/app/actions/crews";
import { getProjects } from "@/app/actions/projects";
import { getEquipments } from "@/app/actions/equipments";
import { getCrewMembers } from "@/app/actions/crew-members";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import DailyLogsList from "./components/list";
import { withBusinessServer } from "@/lib/auth/with-business-server";


export default async function DailyLogs() {
    const { business } = await withBusinessServer();
    const businessId = business.id;

    // Fetch data on the server
    const [logs, crews, projects] = await Promise.all([
        getDailyLogsWithDetails(businessId),
        getCrews(businessId),
        getProjects(businessId),
    ]);



    return (
        <div className="container mx-auto">
            <DailyLogsList logs={logs} crews={crews} projects={projects} />
        </div>
    );
}