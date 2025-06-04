import { Suspense } from "react";
import TasksComponent from "./components/list";
import { getTasks } from "@/app/actions/tasks";
import { getProjects } from "@/app/actions/projects";
import { getCrews } from "@/app/actions/crews";
import { SetStateAction } from "react";
import Link from "next/link";

export default async function TasksPage() {
    try {
        // Fetch all required data in parallel
        const [tasks, projects, crews] = await Promise.all([
            getTasks(),
            getProjects(),
            getCrews(),
        ]);

        return (
            <Suspense
                fallback={
                    <div className="loading loading-spinner loading-lg"></div>
                }
            >
                <TasksComponent
                    tasks={tasks}
                    projects={projects}
                    crews={crews}
                />
            </Suspense>
        );
    } catch (error) {
        console.error("Error loading tasks:", error);
        return (
            <div className="alert alert-error">
                <i className="far fa-exclamation-triangle mr-2"></i>
                Error loading tasks. There was a problem retrieving the data.
            </div>
        );
    }
}

// Helper function to format date
function formatDate(dateString: string | number | Date) {
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
