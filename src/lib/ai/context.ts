import { getProjects } from "@/app/actions/projects";
import { ChatCompletionMessageParam } from "openai/resources";

export async function getRelevantContext(
    businessId: string,
    userInput: string,
    sessionState?: { lastProjectId?: string; lastProjectName?: string }
): Promise<ChatCompletionMessageParam[]> {
    const projects = await getProjects(businessId);

    const indexedProjects = projects.map((project, i) => ({
        index: i + 1,
        id: project.id,
        name: project.name,
        status: project.status || "unknown",
        description: project.description || "No description provided.",
        start_date: project.start_date,
        end_date: project.end_date,
    }));

    // Match referenced project in the userInput
    const matchByNumber = userInput.match(/project (\d+)/i);
    const matchByName = indexedProjects.find(p =>
        userInput.toLowerCase().includes(p.name.toLowerCase())
    );

    const matchedProject =
        matchByNumber && indexedProjects[parseInt(matchByNumber[1]) - 1]
            ? indexedProjects[parseInt(matchByNumber[1]) - 1]
            : matchByName;

    // Fallback to last remembered project
    const fallbackProject =
        !matchedProject &&
        sessionState?.lastProjectId &&
        indexedProjects.find(p => p.id === sessionState.lastProjectId);

    const resolvedProject = matchedProject || fallbackProject;

    const systemContext = `You are an assistant for construction project management.
Users can refer to projects by name or number.
You should maintain conversational context across turns.

Projects:
${indexedProjects.map(p => `${p.index}. ${p.name} [${p.status}]`).join("\n")}`;

    const projectContext = resolvedProject
        ? `Context project: ${resolvedProject.name} [${resolvedProject.status}]
Start: ${resolvedProject.start_date || "Unknown"}, End: ${resolvedProject.end_date || "Unknown"}
Description: ${resolvedProject.description}`
        : "";

    return [
        {
            role: "system" as const,
            content: systemContext
        },
        ...(projectContext
            ? [
                {
                    role: "system" as const,
                    content: projectContext
                }
            ]
            : [])
    ];
}
