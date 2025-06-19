import { Suspense } from "react";
import TasksComponent from "./components/list";
import { getTasks, getTasksWithDetails } from "@/app/actions/tasks";
import { getProjects } from "@/app/actions/projects";
import { getCrews } from "@/app/actions/crews";
import { withBusinessServer } from '@/lib/auth/with-business-server';
import Loading from "@/app/loading";

export default async function TasksPage() {
    const { business } = await withBusinessServer();
    const businessId = business.id;

    // Fetch all required data in parallel
    const [tasks, projects, crews] = await Promise.all([
        getTasksWithDetails(businessId),
        getProjects(businessId),
        getCrews(businessId),
    ]);

    return (
        <Suspense
            fallback={
                <Loading />
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