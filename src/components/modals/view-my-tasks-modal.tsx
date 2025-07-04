"use client"

import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/formatters';
import { getTasksWithDetails, quickUpdateTask, deleteTask } from '@/app/actions/tasks';
import { getProjects } from '@/app/actions/projects';
import { getCrews } from '@/app/actions/crews';
import { TaskWithDetails, Task as TaskType, TaskStatus, taskStatusOptions, TaskPriority, taskPriorityOptions } from '@/types/tasks';
import { Project } from '@/types/projects';
import { Crew } from '@/types/crews';
import { useBusiness } from '@/lib/business-context';
import TaskDetailsModal from '@/app/dashboard/tasks/components/task-details-modal';
import toast from 'react-hot-toast';

interface ViewMyTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateNewTask?: () => void;
}

export default function ViewMyTasksModal({ isOpen, onClose, onCreateNewTask }: ViewMyTasksModalProps) {
    const { businessId } = useBusiness();
    const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [crews, setCrews] = useState<Crew[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
    const [taskModalOpen, setTaskModalOpen] = useState(false);

    // Load real data from API
    useEffect(() => {
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
                console.error('Error fetching tasks data:', error);
                toast.error('Failed to load tasks');
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen, businessId]);

    const filteredTasks = tasks.filter(task => {
        const matchesTab = activeTab === 'all' || task.status === activeTab;
        const matchesSearch = searchTerm === '' ||
            task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesTab && matchesSearch;
    });

    const getStatusBadgeClass = (status: string | null): string => {
        if (!status) return 'badge-ghost';
        switch (status) {
            case 'completed':
                return 'badge-success';
            case 'in_progress':
                return 'badge-warning';
            case 'not_started':
                return 'badge-secondary';
            case 'on_hold':
                return 'badge-info';
            case 'cancelled':
                return 'badge-error';
            default:
                return 'badge-ghost';
        }
    };

    const getPriorityIcon = (priority: string | null): string => {
        switch (priority) {
            case 'high':
            case 'urgent':
                return 'fas fa-exclamation-triangle text-error';
            case 'medium':
                return 'fas fa-circle text-warning';
            case 'low':
                return 'fas fa-minus text-success';
            default:
                return 'fas fa-circle text-base-content/30';
        }
    };

    const isOverdue = (endDate?: string | null): boolean => {
        if (!endDate) return false;
        return new Date(endDate) < new Date();
    };

    const handleTaskClick = (task: TaskWithDetails) => {
        setSelectedTask(task);
        setTaskModalOpen(true);
    };

    const handleTaskUpdate = (updatedTask: TaskType) => {
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === updatedTask.id
                    ? { ...task, ...updatedTask }
                    : task
            )
        );
        setTaskModalOpen(false);
        setSelectedTask(null);
    };

    const handleTaskDelete = (taskId: string) => {
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
        setTaskModalOpen(false);
        setSelectedTask(null);
    };

    const markTaskComplete = async (taskId: string) => {
        try {
            const updatedTask = await quickUpdateTask(businessId, taskId, {
                status: 'completed',
                progress: 100
            });
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId
                        ? { ...task, status: 'completed', progress: 100 }
                        : task
                )
            );
            toast.success('Task marked as completed!');
        } catch (error) {
            console.error('Error completing task:', error);
            toast.error('Failed to complete task');
        }
    };

    const startTask = async (taskId: string) => {
        try {
            const updatedTask = await quickUpdateTask(businessId, taskId, {
                status: 'in_progress'
            });
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId
                        ? { ...task, status: 'in_progress' }
                        : task
                )
            );
            toast.success('Task started!');
        } catch (error) {
            console.error('Error starting task:', error);
            toast.error('Failed to start task');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-5xl p-0">
                {/* Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">My Tasks</h2>
                            <p className="text-primary-content/80 text-sm mt-1">
                                View and manage your assigned tasks
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            aria-label="Close modal"
                        >
                            <i className="far fa-times text-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
                    {/* Search and Filter Section */}
                    <div className="card bg-base-100 border border-base-300 shadow-sm">
                        <div className="card-body p-4">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <i className="far fa-filter text-primary"></i>
                                Filter & Search
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Search tasks</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Search by name, project, or description..."
                                        className="input input-bordered input-secondary"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Status filter</span>
                                    </label>
                                    <div className="tabs tabs-boxed">
                                        {(['all', 'not_started', 'in_progress', 'completed'] as const).map((tab) => (
                                            <button
                                                key={tab}
                                                className={`tab tab-sm ${activeTab === tab ? 'tab-active' : ''}`}
                                                onClick={() => setActiveTab(tab)}
                                            >
                                                {tab === 'all' ? 'All' : tab.replace('_', ' ')}
                                                <span className="ml-1 text-xs opacity-70">
                                                    ({tab === 'all' ? tasks.length : tasks.filter(t => t.status === tab).length})
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tasks List Section */}
                    <div className="card bg-base-100 border border-base-300 shadow-sm">
                        <div className="card-body p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    <i className="far fa-tasks text-primary"></i>
                                    Task List
                                    <span className="badge badge-secondary badge-sm">
                                        {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                                    </span>
                                </h3>

                                <button
                                    className="btn btn-primary btn-sm gap-2"
                                    onClick={() => {
                                        onCreateNewTask?.();
                                        onClose();
                                    }}
                                >
                                    <i className="far fa-plus"></i>
                                    New Task
                                </button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="text-center">
                                            <span className="loading loading-spinner loading-lg text-primary"></span>
                                            <p className="mt-2 text-sm text-base-content/70">Loading tasks...</p>
                                        </div>
                                    </div>
                                ) : filteredTasks.length === 0 ? (
                                    <div className="text-center py-8 text-base-content/70">
                                        <i className="far fa-tasks text-4xl mb-4 opacity-30"></i>
                                        <p className="text-lg font-medium">No tasks found</p>
                                        <p className="text-sm">
                                            {searchTerm ? 'Try adjusting your search terms' : 'No tasks match the current filter'}
                                        </p>
                                        {searchTerm && (
                                            <button
                                                className="btn btn-ghost btn-sm mt-3 gap-2"
                                                onClick={() => setSearchTerm('')}
                                            >
                                                <i className="far fa-times"></i>
                                                Clear search
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    filteredTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className={`card border shadow-sm transition-colors ${isOverdue(task.end_date) && task.status !== 'completed'
                                                    ? 'border-error bg-error/5'
                                                    : 'border-base-300 bg-base-50'
                                                }`}
                                        >
                                            <div className="card-body p-4">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                            <i className={`${getPriorityIcon(task.priority)} text-sm`}></i>
                                                            <button
                                                                onClick={() => handleTaskClick(task)}
                                                                className="font-semibold text-base truncate text-left hover:text-primary transition-colors cursor-pointer underline-offset-2 hover:underline"
                                                            >
                                                                {task.name}
                                                            </button>
                                                            <div className={`badge badge-sm ${getStatusBadgeClass(task.status)}`}>
                                                                {task.status?.replace('_', ' ') || 'Unknown'}
                                                            </div>
                                                            {isOverdue(task.end_date) && task.status !== 'completed' && (
                                                                <div className="badge badge-error badge-sm gap-1">
                                                                    <i className="far fa-clock text-xs"></i>
                                                                    Overdue
                                                                </div>
                                                            )}
                                                        </div>

                                                        {task.description && (
                                                            <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
                                                                {task.description}
                                                            </p>
                                                        )}

                                                        <div className="flex flex-wrap gap-3 text-xs text-base-content/60">
                                                            {task.project_name && (
                                                                <span className="flex items-center gap-1">
                                                                    <i className="far fa-project-diagram"></i>
                                                                    <span className="font-medium">{task.project_name}</span>
                                                                </span>
                                                            )}
                                                            {task.end_date && (
                                                                <span className="flex items-center gap-1">
                                                                    <i className="far fa-calendar-alt"></i>
                                                                    <span>Due {formatDate(task.end_date)}</span>
                                                                </span>
                                                            )}
                                                            {task.created_by && (
                                                                <span className="flex items-center gap-1">
                                                                    <i className="far fa-user"></i>
                                                                    <span>Created by {task.created_by}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2 shrink-0">
                                                        {task.status === 'not_started' && (
                                                            <button
                                                                className="btn btn-primary btn-sm gap-2"
                                                                onClick={() => startTask(task.id)}
                                                            >
                                                                <i className="far fa-play"></i>
                                                                Start
                                                            </button>
                                                        )}
                                                        {task.status === 'in_progress' && (
                                                            <button
                                                                className="btn btn-success btn-sm gap-2"
                                                                onClick={() => markTaskComplete(task.id)}
                                                            >
                                                                <i className="far fa-check"></i>
                                                                Complete
                                                            </button>
                                                        )}
                                                        {task.status === 'completed' && task.updated_at && (
                                                            <div className="text-xs text-success text-center">
                                                                <i className="far fa-check-circle"></i>
                                                                <div className="font-medium">Completed</div>
                                                                <div className="opacity-70">{formatDate(task.updated_at)}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-base-content/70">
                            <i className="far fa-info-circle mr-1"></i>
                            Showing {filteredTasks.length} of {tasks.length} tasks
                        </div>
                        <div className="flex gap-3">
                            <button
                                className="btn btn-outline"
                                onClick={onClose}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Details Modal */}
            {taskModalOpen && selectedTask && (
                <TaskDetailsModal
                    isOpen={taskModalOpen}
                    onClose={() => {
                        setTaskModalOpen(false);
                        setSelectedTask(null);
                    }}
                    task={selectedTask}
                    crews={crews}
                    onTaskUpdate={handleTaskUpdate}
                    onTaskDelete={handleTaskDelete}
                />
            )}
        </div>
    );
}
