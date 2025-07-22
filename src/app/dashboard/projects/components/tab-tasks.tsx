import { Task, TaskStatus, taskStatusOptions, TaskWithDetails } from "@/types/tasks";
import { ProjectMilestone } from "@/types/project_milestones";
import { progressBar } from "@/utils/progress";
import { format as formatDate } from "date-fns";
import ErrorBoundary from "@/components/error-boundary";

// Helper function for safe date formatting
const safeFormatDate = (dateValue: string | Date | null | undefined, formatStr: string): string => {
    if (!dateValue) return "Not set";

    try {
        const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
        // Check if date is valid
        if (isNaN(date.getTime())) return "Invalid date";
        return formatDate(date, formatStr);
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Invalid date";
    }
};

interface TasksTabProps {
    tasks: TaskWithDetails[];
    milestones?: ProjectMilestone[];
    onTaskEdit?: (task: TaskWithDetails) => void;
}

export default function TasksTab({ tasks, milestones = [], onTaskEdit }: TasksTabProps) {
    // Group tasks by milestone
    const tasksByMilestone = tasks.reduce((acc, task) => {
        const milestoneId = task.milestone_id || 'none';
        if (!acc[milestoneId]) {
            acc[milestoneId] = [];
        }
        acc[milestoneId].push(task);
        return acc;
    }, {} as Record<string, TaskWithDetails[]>);

    // Get milestone name by ID
    const getMilestoneName = (milestoneId: string) => {
        const milestone = milestones.find(m => m.id === milestoneId);
        return milestone?.name || 'No Milestone';
    };

    return (
        <ErrorBoundary fallback={(error) => (
            <div className="alert alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                    <h3 className="font-bold">Failed to load tasks</h3>
                    <div className="text-xs">Task list is temporarily unavailable.</div>
                </div>
            </div>
        )}>
            <div className="">
                {tasks.length === 0 ? (
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="card-title">No tasks added yet</h2>
                            <p className="text-base-content/70">Start by creating a new task to manage your project effectively.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Tasks with milestones first */}
                        {milestones.map(milestone => {
                            const milestoneTasks = tasksByMilestone[milestone.id] || [];
                            if (milestoneTasks.length === 0) return null;

                            return (
                                <div key={milestone.id} className="card bg-base-100 shadow-md">
                                    <div className="card-body">
                                        <h3 className="card-title text-lg text-primary">
                                            <i className="far fa-flag mr-2"></i>
                                            {milestone.name}
                                        </h3>
                                        <div className="overflow-x-auto">
                                            <table className="table table-zebra">
                                                <thead>
                                                    <tr>
                                                        <th>Task</th>
                                                        <th>Assigned To</th>
                                                        <th>Status</th>
                                                        <th>Progress</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {milestoneTasks.map((task) => (
                                                        <tr key={task.id}>
                                                            <td>
                                                                <div className="font-medium">{task.name}</div>
                                                                <div className="text-xs text-base-content/70">
                                                                    {task.start_date ? safeFormatDate(task.start_date, "MM/dd/yyyy") : "No start date"} - {task.end_date ? safeFormatDate(task.end_date, "MM/dd/yyyy") : "No end date"}
                                                                </div>
                                                            </td>
                                                            <td>{task.crew_name}</td>
                                                            <td>{taskStatusOptions.badge(task.status as TaskStatus)}</td>
                                                            <td>{progressBar(task.progress, 100)}</td>
                                                            <td>
                                                                {onTaskEdit && (
                                                                    <button
                                                                        className="btn btn-sm btn-secondary"
                                                                        onClick={() => onTaskEdit(task)}
                                                                        title="View/Edit Task"
                                                                    >
                                                                        <i className="far fa-eye mr-1"></i>
                                                                        View Details
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Tasks without milestones */}
                        {(tasksByMilestone['none'] || []).length > 0 && (
                            <div className="card bg-base-100 shadow-md">
                                <div className="card-body">
                                    <h3 className="card-title text-lg">
                                        <i className="far fa-tasks mr-2"></i>
                                        Tasks (No Milestone)
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra">
                                            <thead>
                                                <tr>
                                                    <th>Task</th>
                                                    <th>Assigned To</th>
                                                    <th>Status</th>
                                                    <th>Progress</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(tasksByMilestone['none'] || []).map((task) => (
                                                    <tr key={task.id}>
                                                        <td>
                                                            <div className="font-medium">{task.name}</div>
                                                            <div className="text-xs text-base-content/70">
                                                                {task.start_date ? safeFormatDate(task.start_date, "MM/dd/yyyy") : "No start date"} - {task.end_date ? safeFormatDate(task.end_date, "MM/dd/yyyy") : "No end date"}
                                                            </div>
                                                        </td>
                                                        <td>{task.crew_name}</td>
                                                        <td>{taskStatusOptions.badge(task.status as TaskStatus)}</td>
                                                        <td>{progressBar(task.progress, 100)}</td>
                                                        <td>
                                                            {onTaskEdit && (
                                                                <button
                                                                    className="btn btn-sm btn-secondary"
                                                                    onClick={() => onTaskEdit(task)}
                                                                    title="View/Edit Task"
                                                                >
                                                                    <i className="far fa-eye mr-1"></i>
                                                                    View Details
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}