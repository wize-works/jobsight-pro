"use client";

import { getDailyLogsWithDetails } from "@/lib/actions/daily-logs-client";
import { getCrews } from "@/lib/actions/crews-client";
import { getProjects } from "@/lib/actions/projects-client";

import DailyLogsList from "./components/list";
import { useBusiness } from "@/lib/business-context";
import { useEffect, useState } from "react";
import { DailyLog, DailyLogWithDetails } from "@/types/daily-logs";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import Loading from "@/app/loading";
import DailyLogsListLoading from "./loading";
import ErrorBoundary from "@/components/error-boundary";


export default function DailyLogs() {
    const [loading, setLoading] = useState(true);
    const { businessId } = useBusiness();
    const [logs, setLogs] = useState<DailyLogWithDetails[]>([]);
    const [crews, setCrews] = useState<Crew[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!businessId) {
                return;
            }
            // Fetch data on the server
            const [logs, crews, projects] = await Promise.all([
                getDailyLogsWithDetails(businessId),
                getCrews(businessId),
                getProjects(businessId),
            ]);

            setLogs(logs);
            setCrews(crews);
            setProjects(projects);
            setLoading(false);
        };

        fetchData().catch((error) => {
            console.error("Error fetching daily logs:", error);
        });
    }, [businessId]); if (loading) {
        return (
            <DailyLogsListLoading />
        );
    } return (
        <div className="container mx-auto">
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load daily logs</h3>
                        <div className="text-xs">Daily logs are temporarily unavailable. Please refresh the page.</div>
                    </div>
                </div>
            )}>
                <DailyLogsList logs={logs} crews={crews} projects={projects} />
            </ErrorBoundary>
        </div>
    );
}