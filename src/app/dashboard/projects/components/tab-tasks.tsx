import { Task, TaskStatus, taskStatusOptions, TaskWithDetails } from "@/types/tasks";
import { progressBar } from "@/utils/progress";
import { formatDate } from "date-fns";

export default function TasksTab({ tasks }: { tasks: TaskWithDetails[] }) {

    return (
        <div className="">
            {tasks.length === 0 ? (
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <h2 className="card-title">No tasks added yet</h2>
                        <p className="text-base-content/70">Start by creating a new task to manage your project effectively.</p>
                    </div>
                </div>
            ) : (
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Task</th>
                                        <th>Assigned To</th>
                                        <th>Status</th>
                                        <th>Progress</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.length > 0 ? (
                                        tasks.map((task) => (
                                            <tr key={task.id}>
                                                <td>
                                                    <div className="font-medium">{task.name}</div>
                                                    <div className="text-xs text-base-content/70">
                                                        {formatDate(task.start_date || "", "MM/dd/yyyy")} - {formatDate(task.end_date || "", "MM/dd/yyyy")}
                                                    </div>
                                                </td>
                                                <td>{task.crew_name}</td>
                                                <td>{taskStatusOptions.badge(task.status as TaskStatus)}</td>
                                                <td>{progressBar(task.progress, 100)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4">No tasks added yet</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}