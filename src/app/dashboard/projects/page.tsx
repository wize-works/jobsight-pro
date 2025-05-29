export const dynamic = "force-dynamic";

import ProjectList from "./components/list";
import { getProjects } from "@/app/actions/projects";

export default async function ProjectsPage() {
    const projects = await getProjects();

    return (
        <div>
            <ProjectList initialProjects={projects} />
        </div>
    )
}
