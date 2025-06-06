import { Suspense } from "react";
import TaskDetailComponent from "./components/detail";
import { getTaskById } from "@/app/actions/tasks";
import { getProjects } from "@/app/actions/projects";
import { getCrews } from "@/app/actions/crews";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        // Fetch all required data in parallel
        const [task, projects, crews] = await Promise.all([
            getTaskById(id),
            getProjects(),
            getCrews()
        ]);

        if (!task) {
            throw new Error("Task not found");
        }

        return (
            <Suspense fallback={<div className="loading loading-spinner loading-lg"></div>}>
                <TaskDetailComponent task={task} projects={projects} crews={crews} />
            </Suspense>
        );
    } catch (error) {
        console.error("Error loading task:", error);
        return (
            <div className="alert alert-error">
                <i className="far fa-exclamation-triangle mr-2"></i>
                Error loading task. The task may not exist or there was a problem retrieving the data.
            </div>
        );
    }
}