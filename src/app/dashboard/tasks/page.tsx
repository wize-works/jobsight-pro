"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getTasksWithDetails } from "@/app/actions/tasks";
import { getProjects } from "@/app/actions/projects";
import { getCrews } from "@/app/actions/crews";
import { TaskWithDetails, Task } from "@/types/tasks";
import { Project } from "@/types/projects";
import { Crew } from "@/types/crews";
import { useBusiness } from "@/lib/business-context";
import ErrorBoundary from "@/components/error-boundary";
import TaskGridView from "./components/task-grid-view";
import TaskDetailsModal from "./components/task-details-modal";
import toast from "react-hot-toast";

export default function TasksPage() {
    const { businessId } = useBusiness();
    const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [crews, setCrews] = useState<Crew[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [businessId]);

    const fetchData = async () => {
        if (!businessId) return;

        try {
            setLoading(true);
            setError(null);

            const [tasksData, projectsData, crewsData] = await Promise.all([
                getTasksWithDetails(businessId),
                getProjects(businessId),
                getCrews(businessId)
            ]);

            setTasks(tasksData);
            setProjects(projectsData);
            setCrews(crewsData);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load tasks. Please try again.");
        } finally {
            setLoading(false);
        }
    }; const handleTaskCreated = (newTask: Task) => {
        // Convert Task to TaskWithDetails format for the display
        const taskWithDetails: TaskWithDetails = {
            ...newTask,
            project_name: projects.find(p => p.id === newTask.project_id)?.name || '',
            client_name: '',
            crew_name: crews.find(c => c.id === newTask.assigned_to)?.name || ''
        };
        setTasks(prev => [taskWithDetails, ...prev]);
        setShowAddTaskModal(false);
        toast.success("Task created successfully!");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="loading loading-spinner loading-lg"></div>
                <span className="ml-2">Loading tasks...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <i className="far fa-exclamation-triangle mr-2"></i>
                {error}
                <button onClick={fetchData} className="btn btn-sm btn-outline ml-4">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div>
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold">Tasks</h1>
                        <p className="text-base-content/70 mt-1">
                            Manage and track your project tasks with style
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddTaskModal(true)}
                            className="btn btn-primary"
                        >
                            <i className="far fa-plus mr-2"></i>
                            Add Task
                        </button>
                        {/* <Link href="/dashboard/tasks/kanban" className="btn btn-outline">
                            <i className="far fa-columns mr-2"></i>
                            Kanban View
                        </Link> */}
                    </div>
                </div>

                {/* Enhanced Task Grid */}
                <TaskGridView
                    initialTasks={tasks}
                    initialProjects={projects}
                    initialCrews={crews}
                />                {/* Add Task Modal */}
                <TaskDetailsModal
                    isOpen={showAddTaskModal}
                    onClose={() => setShowAddTaskModal(false)}
                    task={null} // null = create mode
                    projects={projects}
                    crews={crews}
                    onTaskUpdate={() => { }} // Not used in create mode
                    onTaskDelete={() => { }} // Not used in create mode
                    onTaskCreate={handleTaskCreated}
                />
            </div>
        </ErrorBoundary>
    );
}
