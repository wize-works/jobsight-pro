import { createDailyLogFromAI } from "./handlers/daily-log";
import { createTaskFromAI } from "./handlers/task";

export const functionSchemas = [
    {
        name: "create_daily_log",
        description: "Create a new daily log entry",
        parameters: {
            type: "object",
            properties: {
                project_id: { type: "string" },
                work_completed: { type: "string" },
                hours_worked: { type: "number" }
            },
            required: ["project_id", "work_completed"]
        }
    },
    {
        name: "create_task",
        description: "Create a task for a project",
        parameters: {
            type: "object",
            properties: {
                project_id: { type: "string" },
                name: { type: "string" },
                due_date: { type: "string", format: "date" }
            },
            required: ["project_id", "name"]
        }
    }
];

export const functionMap = {
    create_daily_log: createDailyLogFromAI,
    create_task: createTaskFromAI
};
