"use client";
import { Crew } from "@/types/crews";
import { DailyLogWithDetails } from "@/types/daily-logs";
import { Project } from "@/types/projects";
import { useState } from "react";
import CreateDailyLogModal from "./modal-log";
import { Equipment } from "@/types/equipment";
import { CrewMember } from "@/types/crew-members";

interface DailyLogsListProps {
    initialLogs: DailyLogWithDetails[];
    initialCrews: Crew[];
    initialCrewMembers: CrewMember[];
    initialProjects: Project[];
    initialEquipments: Equipment[]
}

export default function DailyLogsList({ initialLogs, initialCrews, initialCrewMembers, initialProjects, initialEquipments }: DailyLogsListProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<DailyLogWithDetails[]>(initialLogs);
    const [filteredLogs, setFilteredLogs] = useState<DailyLogWithDetails[]>(initialLogs);
    const [selectedLog, setSelectedLog] = useState<DailyLogWithDetails | null>(null);
    const [crews] = useState<Crew[]>(initialCrews);
    const [crewMembers] = useState<CrewMember[]>(initialCrewMembers);
    const [projects] = useState<Project[]>(initialProjects);
    const [equipments] = useState<Equipment[]>(initialEquipments);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleNewLog = (newLog: DailyLogWithDetails) => {
        setLogs(prev => [newLog, ...prev]);
        setFilteredLogs(prev => [newLog, ...prev]);
    };

    const filterByCrew = (crewId: string) => {
        if (crewId) {
            setFilteredLogs(logs.filter(log => log.crew_id === crewId));
        } else {
            setFilteredLogs(logs); // Reset to all logs
        }
    };

    const filterByProject = (projectId: string) => {
        if (projectId) {
            setFilteredLogs(logs.filter(log => log.project_id === projectId));
        } else {
            setFilteredLogs(logs); // Reset to all logs
        }
    }; return (
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
            </div>

            {/* Stats Cards */}
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
                            <i className="far fa-person-digging fa-xl text-warning"></i>
                        </div>
                    </div>
                    <div className="stat-desc">Ongoing projects</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-base-100 p-4 rounded-lg shadow mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <select
                        className="select select-bordered select-secondary w-full"
                        onChange={(e) => filterByCrew(e.target.value)}
                    >
                        <option value="">All Crews</option>
                        {crews.map(crew => (
                            <option key={crew.id} value={crew.id}>{crew.name}</option>
                        ))}
                    </select>

                    <select
                        className="select select-bordered select-secondary w-full"
                        onChange={(e) => filterByProject(e.target.value)}
                    >
                        <option value="">All Projects</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>

                    <input type="date" className="input input-bordered input-secondary w-full" />

                    <div className="form-control">
                        <button className="btn btn-primary">Apply Filters</button>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-2 text-center py-10">
                        <div className="loading loading-spinner loading-lg"></div>
                        <p className="mt-4">Loading daily logs...</p>
                    </div>
                ) : error ? (
                    <div className="col-span-2 alert alert-error">
                        <i className="far fa-exclamation-triangle mr-2"></i>
                        {error}
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="col-span-2 alert alert-info">
                        <i className="far fa-info-circle mr-2"></i>
                        No daily logs found matching your criteria
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className={`card bg-base-100 shadow ${selectedLog?.id === log.id ? "border border-primary" : ""}`}
                            onClick={() => setSelectedLog(log)}
                        >
                            <div className="card-body">
                                <div className="flex items-center justify-between">
                                    <h2 className="card-title">{log.project?.name}</h2>
                                    <a className="btn btn-sm btn-outline" href={`/dashboard/daily-logs/${log.id}`}>
                                        View Details
                                    </a>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-base-content/50">Crew: {log.crew?.name}</span>
                                </div>
                                <div className="mt-2">
                                    <span className="badge badge-secondary">{new Date(log.date).toLocaleDateString()}</span>
                                    <span className="badge badge-info ml-2">Hours: {log.hours_worked || 0}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="font-semibold">Work Completed</h3>
                                        {log.work_completed}

                                        <h3 className="font-semibold mt-2">Safety Concerns</h3>
                                        {log.safety || "None reported"}

                                        <h3 className="font-semibold mt-2">Quality Summary</h3>
                                        {log.quality || "No quality status reported"}

                                        <h3 className="font-semibold mt-2">Work Delays</h3>
                                        {log.delays || "No delays reported"}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Materials Used:</h3>
                                        <ul className="list-disc pl-5">
                                            {log.materials.map(material => (
                                                <li key={material.id}>
                                                    {material.name} - {material.quantity} @ ${material.cost?.toFixed(2) || "0.00"} each
                                                </li>
                                            ))}
                                        </ul>
                                        <h3 className="font-semibold mt-2">Equipment Used:</h3>
                                        <ul className="list-disc pl-5">
                                            {log.equipment.map(equip => (
                                                <li key={equip.id}>
                                                    {equip.name} - {equip.hours} hours
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold mt-2">Notes:</h3>
                                    {log.notes}
                                </div>
                            </div>
                        </div>))
                )}
            </div>

            {/* Create Daily Log Modal */}
            <CreateDailyLogModal
                crews={crews}
                crewMembers={crewMembers}
                projects={projects}
                equipments={equipments}
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleNewLog}
            />
        </>
    );
}