import React, { Suspense } from "react";
import Link from "next/link";
import { Project, ProjectInsert, ProjectStatus, projectStatusOptions } from "@/types/projects";
import { getProjectById, updateProject } from "@/app/actions/projects";
import { createProjectMilestone, getProjectMilestonesByProjectId, updateProjectMilestone } from "@/app/actions/project_milestones";
import { getTasksByProjectId } from "@/app/actions/tasks";
import { getClientById } from "@/app/actions/clients";
import { toast } from "@/hooks/use-toast";
import { ProjectMilestone, ProjectMilestoneStatus, projectMilestoneStatusOptions } from "@/types/project_milestones";
import { TaskWithDetails } from "@/types/tasks";
import { Client } from "@/types/clients";
import { getClientContactsByClientId } from "@/app/actions/client-contacts";
import { ClientContact } from "@/types/client-contacts";
import { getCrewsByProjectId } from "@/app/actions/crews";
import { CrewWithMemberInfo } from "@/types/crews";
import { getProjectIssuesWithDetailsByProjectId } from "@/app/actions/projects-issues";
import { ProjectIssueWithDetails } from "@/types/projects-issues";
import Loading from "./loading";
import { getMediaByProjectId } from "@/app/actions/media";
import { Media } from "@/types/media";
import MediaTab from "../components/tab-media";
import { getCrewMemberById, getCrewMembers } from "@/app/actions/crew-members";
import { CrewMember } from "@/types/crew-members";
import ProjectDetail from "../components/detail";

const formatDate = (dateString: string): string => {
    if (!dateString) return "Not set";

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (error) {
        return dateString;
    }
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(amount || 0);
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const [project, milestones, tasks, crews, issues, documents] = await Promise.all([
        getProjectById(id),
        getProjectMilestonesByProjectId(id),
        getTasksByProjectId(id),
        getCrewsByProjectId(id),
        getProjectIssuesWithDetailsByProjectId(id),
        getMediaByProjectId(id, "document")
    ]);

    let client: Client | null = null;
    let contacts: ClientContact[] = [];

    if (project && project.client_id) {
        client = await getClientById(project.client_id);

        contacts = await getClientContactsByClientId(project.client_id);
    }

    let manager: CrewMember | null = null;
    if (project && project.manager_id) {
        manager = await getCrewMemberById(project.manager_id);
    }

    if (!project) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold">Project not found</h2>
                <p className="text-base-content/70">The project you are looking for does not exist.</p>
                <Link href="/dashboard/projects" className="btn btn-primary mt-4">
                    <i className="fas fa-arrow-left mr-2"></i> Back to Projects
                </Link>
            </div>
        );
    }

    return (
        <Suspense fallback={<Loading />}>
            <ProjectDetail
                project={project}
                milestones={milestones}
                tasks={tasks}
                client={client}
                contacts={contacts}
                crews={crews}
                issues={issues}
                documents={documents}
            />
        </Suspense>
    );
};

