import { Suspense } from "react";
import TasksComponent from "./components/list";
import { getTasks, getTasksWithDetails } from "@/app/actions/tasks";
import { getProjects } from "@/app/actions/projects";
import { getCrews } from "@/app/actions/crews";

export default async function TasksPage() {
    // Fetch all required data in parallel
    const [tasks, projects, crews] = await Promise.all([
        getTasksWithDetails(),
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