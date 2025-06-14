
import { openai, AI_MODELS } from './client';
import { PROMPTS } from './prompts';
import { createServerClient } from '@/lib/supabase';

export interface QueryContext {
    projects: any[];
    dailyLogs: any[];
    tasks: any[];
    equipment: any[];
    crews: any[];
}

export async function queryProjectData(
    question: string,
    businessId: string
): Promise<string> {
    try {
        const supabase = createServerClient();

        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }

        // Fetch relevant context data
        const [projectsRes, logsRes, tasksRes, equipmentRes, crewsRes] = await Promise.all([
            supabase.from('projects').select('*').eq('business_id', businessId).limit(50),
            supabase.from('daily_logs').select('*').eq('business_id', businessId).order('created_at', { ascending: false }).limit(100),
            supabase.from('tasks').select('*').eq('business_id', businessId).limit(100),
            supabase.from('equipment').select('*').eq('business_id', businessId).limit(50),
            supabase.from('crews').select('*').eq('business_id', businessId).limit(20),
        ]);

        const context: QueryContext = {
            projects: projectsRes.data || [],
            dailyLogs: logsRes.data || [],
            tasks: tasksRes.data || [],
            equipment: equipmentRes.data || [],
            crews: crewsRes.data || [],
        };

        const completion = await openai.chat.completions.create({
            model: AI_MODELS.CHAT,
            messages: [
                {
                    role: 'system',
                    content: PROMPTS.PROJECT_QUERY,
                },
                {
                    role: 'user',
                    content: `Question: ${question}\n\nContext Data:\n${JSON.stringify(context, null, 2)}`,
                },
            ],
            temperature: 0.2,
        });

        return completion.choices[0]?.message?.content || 'Unable to process query';
    } catch (error) {
        console.error('Query processing error:', error);
        throw new Error('Failed to process query');
    }
}
