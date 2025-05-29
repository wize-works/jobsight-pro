import { getProjectById } from "@/app/actions/projects";
import { getProjectTasksByProjectId } from "../../../actions/project-tasks";
import { getProjectMembersByProjectId } from "../../../actions/project-members";
import { getProjectMediaByProjectId } from "../../../actions/project-media";
import ProjectDetailComponent from "../components/project-detail";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;

    const [project, tasks, members, media] = await Promise.all([
        getProjectById(projectId),
        getProjectTasksByProjectId(projectId),
        getProjectMembersByProjectId(projectId),
        getProjectMediaByProjectId(projectId)
    ]);

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Project not found</h2>
                <p>The requested project does not exist or you don't have permission to view it.</p>
            </div>
        );
    }    // Calculate project progress metrics
    const startDate = project.start_date ? new Date(project.start_date) : new Date();
    const endDate = project.end_date ? new Date(project.end_date) : new Date();
    const currentDate = new Date();
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsedCapped = Math.min(daysElapsed, totalDays);
    
    // Mock data for client contacts and crews
    const mockContacts = [
        {
            name: "Michael Thompson",
            role: "Project Manager",
            email: "michael@oakridge.com",
            phone: "(555) 123-4567"
        },
        {
            name: "Sarah Williams",
            role: "Financial Officer",
            email: "sarah@oakridge.com", 
            phone: "(555) 234-5678"
        }
    ];
    
    const mockCrews = [
        {
            id: "crew1",
            name: "Foundation Team",
            leader: "Mike Wilson",
            members: 8
        },
        {
            id: "crew2",
            name: "Electrical Team",
            leader: "David Martinez",
            members: 6
        }
    ];
    
    const mockMilestones = [
        {
            id: "ms1",
            name: "Site Preparation",
            dueDate: "2025-04-15",
            status: "Completed",
            description: "Clear the site and prepare for foundation work"
        },
        {
            id: "ms2", 
            name: "Foundation Work",
            dueDate: "2025-05-30",
            status: "In Progress",
            description: "Complete all foundation and underground utility work"
        },
        {
            id: "ms3",
            name: "Structural Framing",
            dueDate: "2025-07-15",
            status: "Not Started", 
            description: "Complete structural framing for all floors"
        }
    ];
    
    const transformedProject = {
        id: project.id,
        name: project.name,
        status: project.status || "In Progress",
        type: project.type || "Commercial",
        client: "Oakridge Development", // Mock client name
        clientId: project.client_id || "client1",
        budget: project.budget || 9500000,
        startDate: project.start_date || "2025-03-15",
        endDate: project.end_date || "2025-08-20",
        location: "123 Main St, Anytown, USA",
        description: project.description || "A mixed-use commercial development featuring retail spaces on the ground floor and office spaces on upper floors. The project includes parking facilities and landscaped outdoor areas.",
        progress: Math.round((daysElapsedCapped / totalDays) * 100) || 35,
        daysElapsed: daysElapsedCapped || 75,
        totalDays: totalDays || 180,
        budgetUsed: 35,
        tasksCompleted: tasks.filter(task => task.status === "completed").length || 2,
        manager: "Robert Johnson",
        milestones: mockMilestones,
        tasks: tasks.map(task => ({
            id: task.id,
            name: task.name,
            assignedTo: "crew1",
            assignedToName: "Foundation Team",
            startDate: "2025-04-01",
            endDate: "2025-04-15",
            status: task.status || "In Progress",
            progress: task.status === "completed" ? 100 : 60,
        })),
        contacts: mockContacts,
        crews: mockCrews
    };

    return (
        <ProjectDetailComponent
            project={transformedProject}
        />
    );
}