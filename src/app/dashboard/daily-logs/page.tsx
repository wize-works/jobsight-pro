"use client";

import { useDailyLogs } from "@/hooks/useDailyLogs";
import { useCrews } from "@/hooks/useCrews";
import { useProjects } from "@/hooks/useProjects";

import DailyLogsList from "./components/list";
import { useBusiness } from "@/lib/business-context";
import { useEffect, useState, useRef } from "react";
import { DailyLog, DailyLogWithDetails } from "@/types/daily-logs";
import { Crew } from "@/types/crews";
import { Project } from "@/types/projects";
import Loading from "@/app/loading";
import DailyLogsListLoading from "./loading";
import ErrorBoundary from "@/components/error-boundary";


export default function DailyLogs() {
    const { businessId } = useBusiness();
    const crewsFetchedRef = useRef(false);
    const dailyLogsFetchedRef = useRef(false);

    // Use daily logs hook - now matches crews pattern
    const { dailyLogs, loading: logsLoading, error: logsError, fetchDailyLogs } = useDailyLogs();

    // Use crews hook
    const { crews, loading: crewsLoading, error: crewsError, fetchCrews } = useCrews();

    // Use projects hook
    const { projects, loading: projectsLoading, error: projectsError } = useProjects();

    // Overall loading state
    const loading = logsLoading || crewsLoading || projectsLoading;
    const error = logsError || crewsError || projectsError;

    // Fetch data when business ID changes (manual fetching like crews)
    useEffect(() => {
        if (businessId) {
            if (!crewsFetchedRef.current) {
                fetchCrews();
                crewsFetchedRef.current = true;
            }
            if (!dailyLogsFetchedRef.current) {
                fetchDailyLogs({ include: "project,crew,materials,equipment" });
                dailyLogsFetchedRef.current = true;
            }
        }
    }, [businessId, fetchCrews, fetchDailyLogs]);

    if (loading) {
        return (
            <DailyLogsListLoading />
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                    <h3 className="font-bold">Failed to load daily logs</h3>
                    <div className="text-xs">{error}</div>
                </div>
            </div>
        );
    }

    return (
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
                <DailyLogsList logs={dailyLogs as DailyLogWithDetails[]} crews={crews} projects={projects} />
            </ErrorBoundary>
        </div>
    );
}