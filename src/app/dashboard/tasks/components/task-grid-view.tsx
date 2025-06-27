"use client";

import React, { useState, useEffect } from "react";
import { Task, TaskWithDetails, TaskStatus, TaskPriority, taskStatusOptions, taskPriorityOptions } from "@/types/tasks";
import { Project } from "@/types/projects";
import { Crew } from "@/types/crews";
import { getTasksWithDetails, deleteTask } from "@/lib/actions/tasks-client";
import { getProjects } from "@/lib/actions/projects-client";
import { getCrews } from "@/lib/actions/crews-client";
import { useBusiness } from "@/lib/business-context";
import EnhancedTaskCard from "./enhanced-task-card";
import TaskDetailsModal from "./task-details-modal";
import toast from "react-hot-toast";
import { set } from "date-fns";

interface TaskGridViewProps {
    initialTasks?: TaskWithDetails[];
    initialProjects?: Project[];
    initialCrews?: Crew[];
}

export default function TaskGridView({
    initialTasks = [],
    initialProjects = [],
    initialCrews = []
}: TaskGridViewProps) {
    const { businessId } = useBusiness();
    const [tasks, setTasks] = useState<TaskWithDetails[]>(initialTasks);
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [crews, setCrews] = useState<Crew[]>(initialCrews);
    const [loading, setLoading] = useState(false);
    const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
    const [projectFilter, setProjectFilter] = useState<string | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (initialTasks.length === 0) {
            fetchData();
        }
    }, [businessId]);

    const fetchData = async () => {
        if (!businessId) return;

        try {
            setLoading(true);
            const [tasksData, projectsData, crewsData] = await Promise.all([
                getTasksWithDetails(businessId),
                getProjects(businessId),
                getCrews(businessId)
            ]);

            setTasks(tasksData);
            setProjects(projectsData);
            setCrews(crewsData);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleTaskUpdate = (updatedTask: Task) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === updatedTask.id
                    ? { ...task, ...updatedTask }
                    : task
            )
        );
    };

    const handleTaskDelete = async (taskId: string) => {
        try {
            await deleteTask(businessId, taskId);
            setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            toast.success("Task deleted successfully!");
        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error("Failed to delete task");
        }
    };

    const handleOpenDetails = (task: TaskWithDetails) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        if (projectFilter !== 'all' && task.project_id !== projectFilter) return false;
        if (searchQuery && !task.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // Group tasks by status for better organization
    const tasksByStatus = {
        not_started: filteredTasks.filter(task => task.status === 'not_started'),
        in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
        completed: filteredTasks.filter(task => task.status === 'completed'),
        on_hold: filteredTasks.filter(task => task.status === 'on_hold'),
        cancelled: filteredTasks.filter(task => task.status === 'cancelled')
    };

    const getSelectedProject = () => {
        return projects.find(p => p.id === selectedTask?.project_id) || null;
    };

    if (loading && tasks.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="loading loading-spinner loading-lg"></div>
                <span className="ml-2">Loading tasks...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Task Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat bg-base-100 shadow-lg rounded-lg">
                    <div className="stat-figure text-primary">
                        <i className="far fa-tasks fa-2x"></i>
                    </div>
                    <div className="stat-title">Total Tasks</div>
                    <div className="stat-value text-primary">{tasks.length}</div>
                </div>

                <div className="stat bg-base-100 shadow-lg rounded-lg">
                    <div className="stat-figure text-info">
                        <i className="far fa-spinner-third fa-2x"></i>
                    </div>
                    <div className="stat-title">In Progress</div>
                    <div className="stat-value text-info">{tasksByStatus.in_progress.length}</div>
                </div>

                <div className="stat bg-base-100 shadow-lg rounded-lg">
                    <div className="stat-figure text-success">
                        <i className="far fa-check-circle fa-2x"></i>
                    </div>
                    <div className="stat-title">Completed</div>
                    <div className="stat-value text-success">{tasksByStatus.completed.length}</div>
                </div>

                <div className="stat bg-base-100 shadow-lg rounded-lg">
                    <div className="stat-figure text-error">
                        <i className="far fa-exclamation-triangle fa-2x"></i>
                    </div>
                    <div className="stat-title">Overdue</div>
                    <div className="stat-value text-error">
                        {tasks.filter(task =>
                            task.end_date &&
                            new Date(task.end_date) < new Date() &&
                            task.status !== 'completed'
                        ).length}
                    </div>
                </div>
            </div>
            {/* Header with filters */}
            <div className="card bg-base-100 shadow-lg rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                            {/* Search */}
                            <div className="form-control w-full">
                                <input
                                    type="text"
                                    placeholder="Search tasks..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input input-bordered input-secondary w-full"
                                />
                            </div>

                            {/* Filters */}
                            {taskStatusOptions.select(
                                statusFilter,
                                (option) => setStatusFilter(option as TaskStatus | 'all'),
                                "select-secondary w-full"
                            )}

                            {taskPriorityOptions.select(
                                priorityFilter,
                                (option) => setPriorityFilter(option as TaskPriority | 'all'),
                                "select-secondary w-full"
                            )}

                            <select
                                value={projectFilter}
                                onChange={(e) => setProjectFilter(e.target.value)}
                                className="select select-bordered select-secondary w-full"
                            >
                                <option value="all">All Projects</option>
                                {projects.map(project => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks Grid */}
            {filteredTasks.length === 0 ? (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body text-center py-12">
                        <i className="far fa-tasks fa-4x text-base-content/20 mb-4"></i>
                        <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
                        <p className="text-base-content/70">
                            {tasks.length === 0
                                ? "Create your first task to get started"
                                : "Try adjusting your filters to see more tasks"
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredTasks.map((task) => (
                        <EnhancedTaskCard
                            key={task.id}
                            task={task}
                            crews={crews}
                            onTaskUpdate={handleTaskUpdate}
                            onOpenDetails={handleOpenDetails}
                            onDelete={handleTaskDelete}
                        />
                    ))}
                </div>
            )}

            {/* Task Details Modal */}
            <TaskDetailsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                task={selectedTask}
                project={getSelectedProject()}
                crews={crews}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
            />
        </div>
    );
}
