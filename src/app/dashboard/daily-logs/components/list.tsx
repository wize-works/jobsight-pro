"use client";

import { Crew } from "@/types/crews";
import { DailyLogWithDetails } from "@/types/daily-logs";
import { Project } from "@/types/projects";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { formatDateForInput, formatDate } from "@/utils/date";
import { DailyLogCard } from "./card";
import ErrorBoundary from "@/components/error-boundary";
import ModalLoading from "@/components/modal-loading";

// Lazy load modal component for better performance
const DailyLogModal = dynamic(() => import("./modal-log"), {
    loading: () => <ModalLoading message="Loading daily log form..." />,
    ssr: false
});

interface DailyLogsListProps {
    logs: DailyLogWithDetails[];
    crews: Crew[];
    projects: Project[];
}

export default function DailyLogsList({
    logs,
    crews,
    projects,
}: DailyLogsListProps) {
    const [filteredLogs, setFilteredLogs] = useState<DailyLogWithDetails[]>(logs);
    const [selectedLog, setSelectedLog] = useState<DailyLogWithDetails | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    // Filter states
    const [selectedCrewId, setSelectedCrewId] = useState<string>("");
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [dateFilterType, setDateFilterType] = useState<"exact" | "from" | "range">("exact");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    // Update filtered logs when filters change
    useEffect(() => {
        let filtered = [...logs];

        // Filter by crew
        if (selectedCrewId) {
            filtered = filtered.filter(log => log.crew_id === selectedCrewId);
        }

        // Filter by project
        if (selectedProjectId) {
            filtered = filtered.filter(log => log.project_id === selectedProjectId);
        }        // Filter by date
        if (dateFilterType === "exact" && selectedDate) {
            filtered = filtered.filter(log => {
                if (!log.date) return false;
                const logDate = new Date(log.date).toISOString().split('T')[0];
                return logDate === selectedDate;
            });
        } else if (dateFilterType === "from" && fromDate) {
            filtered = filtered.filter(log => {
                if (!log.date) return false;
                const logDate = new Date(log.date).toISOString().split('T')[0];
                return logDate >= fromDate;
            });
        } else if (dateFilterType === "range" && fromDate && toDate) {
            filtered = filtered.filter(log => {
                if (!log.date) return false;
                const logDate = new Date(log.date).toISOString().split('T')[0];
                return logDate >= fromDate && logDate <= toDate;
            });
        }

        setFilteredLogs(filtered);
    }, [logs, selectedCrewId, selectedProjectId, selectedDate, dateFilterType, fromDate, toDate]); const handleNewLog = (newLog: DailyLogWithDetails) => {
        setFilteredLogs(prev => [newLog, ...prev]);
    }; const clearFilters = () => {
        setSelectedCrewId("");
        setSelectedProjectId("");
        setSelectedDate("");
        setDateFilterType("exact");
        setFromDate("");
        setToDate("");
    };

    const setTodayFilter = () => {
        setDateFilterType("exact");
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setFromDate("");
        setToDate("");
    };

    const setThisWeekFilter = () => {
        const today = new Date();
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

        setDateFilterType("range");
        setFromDate(firstDayOfWeek.toISOString().split('T')[0]);
        setToDate(lastDayOfWeek.toISOString().split('T')[0]);
        setSelectedDate("");
    };

    const setThisMonthFilter = () => {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        setDateFilterType("range");
        setFromDate(firstDayOfMonth.toISOString().split('T')[0]);
        setToDate(lastDayOfMonth.toISOString().split('T')[0]);
        setSelectedDate("");
    };

    return (
        <>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Daily Logs</h1>
                    <p className="text-sm text-base-content/50">Manage your daily logs efficiently</p>
                </div>
                <div className="flex items-center space-x-6">
                    <button
                        className="btn btn-primary"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <i className="fal fa-plus fa-fw mr-2"></i>
                        New Log
                    </button>
                </div>
            </div>            {/* Stats Cards */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error mb-6">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load daily logs statistics</h3>
                        <div className="text-xs">Statistics are temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title text-lg">Total Logs</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-3xl text-primary">{logs.length}</div>
                            <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-clipboard-list fa-xl text-primary"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Updated just now</div>
                    </div>
                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title text-lg">Hours Logged</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-3xl text-info">{logs.reduce((total, log) => total + (log.hours_worked || 0), 0)}</div>
                            <div className="stat-icon text-info bg-info/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-clock fa-xl text-info"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Across all crews</div>
                    </div>
                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title text-lg">Active Crews</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-3xl text-accent">{crews.filter(crew => crew.status === "active").length}</div>
                            <div className="stat-icon text-accent bg-accent/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-users fa-xl text-accent"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Currently working</div>
                    </div>
                    <div className="stat bg-base-100 shadow">
                        <div className="stat-title text-lg">Active Projects</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-3xl text-warning">{projects.filter(project => project.status && ["active", "in_progress"].includes(project.status)).length}</div>
                            <div className="stat-icon text-warning bg-warning/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-screwdriver-wrench fa-xl text-warning"></i>
                            </div>
                        </div>                    <div className="stat-desc">Ongoing projects</div>
                    </div>
                </div>
            </ErrorBoundary>            {/* Filters */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error mb-6">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load filters</h3>
                        <div className="text-xs">Filter controls are temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <div className="bg-base-100 p-2 rounded-lg shadow mb-6">

                    <div className="flex flex-col md:flex-row gap-6 mb-4">
                        <select
                            className="select select-bordered select-secondary w-full"
                            value={selectedCrewId}
                            onChange={(e) => setSelectedCrewId(e.target.value)}
                        >
                            <option value="">All Crews</option>
                            {crews.map(crew => (
                                <option key={crew.id} value={crew.id}>{crew.name}</option>
                            ))}
                        </select>

                        <select
                            className="select select-bordered select-secondary w-full"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                        >
                            <option value="">All Projects</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                        </select>

                        <select
                            className="select select-bordered select-secondary w-full"
                            value={dateFilterType}
                            onChange={(e) => setDateFilterType(e.target.value as "exact" | "from" | "range")}
                        >
                            <option value="exact">Exact Date</option>
                            <option value="from">From Date</option>
                            <option value="range">Date Range</option>
                        </select>
                        {dateFilterType === "exact" && (
                            <input
                                type="date"
                                className="input input-bordered input-secondary w-full"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                placeholder="Select date"
                            />
                        )}

                        {dateFilterType === "from" && (
                            <input
                                type="date"
                                className="input input-bordered input-secondary w-full"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                placeholder="From date"
                            />
                        )}

                        {dateFilterType === "range" && (
                            <>
                                <input
                                    type="date"
                                    className="input input-bordered input-secondary w-full"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    placeholder="From date"
                                />
                                <input
                                    type="date"
                                    className="input input-bordered input-secondary w-full"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    placeholder="To date"
                                />
                            </>
                        )}
                    </div>
                    <div className="flex flex-col md:flex-row justify-end gap-4">
                        {/* Quick Date Filters */}
                        <button
                            className="btn btn-sm btn-outline btn-secondary"
                            onClick={setTodayFilter}
                        >
                            Today
                        </button>
                        <button
                            className="btn btn-sm btn-outline btn-secondary"
                            onClick={setThisWeekFilter}
                        >
                            This Week
                        </button>
                        <button
                            className="btn btn-sm btn-outline btn-secondary"
                            onClick={setThisMonthFilter}
                        >
                            This Month
                        </button>
                        <button
                            className="btn btn-outline btn-sm btn-secondary"
                            onClick={clearFilters}
                            disabled={!selectedCrewId && !selectedProjectId && !selectedDate && !fromDate && !toDate}
                        >
                            <i className="far fa-refresh mr-2"></i>
                            Clear Filters
                        </button>                </div>
                </div>
            </ErrorBoundary>            {/* Logs List */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load daily logs list</h3>
                        <div className="text-xs">Daily logs list is temporarily unavailable. Please refresh the page.</div>
                    </div>
                </div>
            )}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredLogs.length === 0 ? (
                        <div className="col-span-2 alert alert-info">
                            <i className="far fa-info-circle mr-2"></i>
                            No daily logs found matching your criteria
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <DailyLogCard
                                key={log.id}
                                log={log}
                                isSelected={selectedLog?.id === log.id}
                                onSelect={setSelectedLog}
                            />
                        )))}
                </div>
            </ErrorBoundary>

            <DailyLogModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleNewLog}
            />
        </>
    );
}