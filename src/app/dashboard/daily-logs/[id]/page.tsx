import { Suspense } from "react";
import DailyLogComponent from "../components/detail";
import { getDailyLogWithDetailsById } from "@/app/actions/daily-logs";
import { getCrews } from "@/app/actions/crews";
import { getProjects } from "@/app/actions/projects";
import { getCrewMembersByCrewId } from "@/app/actions/crew-members";
import { withBusinessServer } from "@/lib/auth/with-business-server";

export default async function DailyLogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { business } = await withBusinessServer();

    try {
        // Fetch all required data in parallel
        const [log, crews, projects] = await Promise.all([
            getDailyLogWithDetailsById(business.id, id),
            getCrews(business.id),
            getProjects(business.id)
        ]);

        const crewMembers = await getCrewMembersByCrewId(business.id, log?.crew_id || "");

        // Make sure we have a valid log with materials and equipment arrays
        if (!log) {
            throw new Error("Daily log not found");
        }

        // Ensure materials and equipment arrays exist even if they're empty
        const safeLog = {
            ...log,
            materials: log.materials || [],
            equipment: log.equipment || []
        };

        return (
            <Suspense fallback={<div className="loading loading-spinner loading-lg"></div>}>
                <DailyLogComponent log={safeLog} crews={crews} projects={projects} crewMembers={crewMembers} />
            </Suspense>
        );
    } catch (error) {
        console.error("Error loading daily log:", error);
        return (
            <div className="alert alert-error">
                <i className="far fa-exclamation-triangle mr-2"></i>
                Error loading daily log. The log may not exist or there was a problem retrieving the data.
            </div>
        );
    }
}