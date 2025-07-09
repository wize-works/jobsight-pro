import { createServerClient } from './supabase';
import type { Database } from '@/types/supabase';

export interface SeedDataOptions {
    businessId: string;
    userId: string;
    userEmail: string;
    userName: string;
}

export async function seedFlintstonesData(options: SeedDataOptions) {
    const supabase = createServerClient();
    if (!supabase) {
        throw new Error('Failed to create Supabase client');
    }

    const { businessId, userId, userEmail, userName } = options;

    try {
        // 1. Create Crew Members (The Flintstones Characters)
        const { data: crewMembers, error: crewMembersError } = await supabase
            .from('crew_members')
            .insert([
                {
                    business_id: businessId,
                    name: 'Fred Flintstone',
                    role: 'Foreman',
                    experience: '15',
                    phone: '555-YABBA',
                    email: 'fred@bedrock.stone',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    name: 'Barney Rubble',
                    role: 'Assistant Foreman',
                    experience: '12',
                    phone: '555-RUBBLE',
                    email: 'barney@bedrock.stone',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    name: 'Wilma Flintstone',
                    role: 'Project Coordinator',
                    experience: '8',
                    phone: '555-WILMA',
                    email: 'wilma@bedrock.stone',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    name: 'Betty Rubble',
                    role: 'Safety Inspector',
                    experience: '6',
                    phone: '555-BETTY',
                    email: 'betty@bedrock.stone',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    name: 'Bamm-Bamm Rubble',
                    role: 'Demolition Specialist',
                    experience: '3',
                    phone: '555-BAMM',
                    email: 'bammbamm@bedrock.stone',
                    created_by: userId,
                    updated_by: userId,
                },
            ])
            .select();

        if (crewMembersError) throw crewMembersError;

        // 2. Create Crews
        const fredId = crewMembers?.find(m => m.name === 'Fred Flintstone')?.id;
        const wilmaId = crewMembers?.find(m => m.name === 'Wilma Flintstone')?.id;

        const { data: crews, error: crewsError } = await supabase
            .from('crews')
            .insert([
                {
                    business_id: businessId,
                    name: 'Stone Age Construction Crew',
                    leader_id: fredId,
                    specialty: 'Stone Construction & Quarrying',
                    status: 'active',
                    notes: 'Primary construction crew specializing in stone-based projects',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    name: 'Safety & Quality Crew',
                    leader_id: wilmaId,
                    specialty: 'Safety Inspection & Quality Control',
                    status: 'active',
                    notes: 'Dedicated to maintaining high safety standards',
                    created_by: userId,
                    updated_by: userId,
                },
            ])
            .select();

        if (crewsError) throw crewsError;

        // 3. Create Crew Member Assignments
        const mainCrewId = crews?.[0]?.id;
        const safetyCrewId = crews?.[1]?.id;
        const barneyId = crewMembers?.find(m => m.name === 'Barney Rubble')?.id;
        const bettyId = crewMembers?.find(m => m.name === 'Betty Rubble')?.id;
        const bammBammId = crewMembers?.find(m => m.name === 'Bamm-Bamm Rubble')?.id;

        if (mainCrewId && safetyCrewId) {
            const { error: assignmentsError } = await supabase
                .from('crew_member_assignments')
                .insert([
                    {
                        business_id: businessId,
                        crew_id: mainCrewId,
                        crew_member_id: fredId,
                        created_by: userId,
                        updated_by: userId,
                    },
                    {
                        business_id: businessId,
                        crew_id: mainCrewId,
                        crew_member_id: barneyId,
                        created_by: userId,
                        updated_by: userId,
                    },
                    {
                        business_id: businessId,
                        crew_id: mainCrewId,
                        crew_member_id: bammBammId,
                        created_by: userId,
                        updated_by: userId,
                    },
                    {
                        business_id: businessId,
                        crew_id: safetyCrewId,
                        crew_member_id: wilmaId,
                        created_by: userId,
                        updated_by: userId,
                    },
                    {
                        business_id: businessId,
                        crew_id: safetyCrewId,
                        crew_member_id: bettyId,
                        created_by: userId,
                        updated_by: userId,
                    },
                ]);

            if (assignmentsError) throw assignmentsError;
        }

        // 4. Create Clients
        const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .insert([
                {
                    business_id: businessId,
                    name: 'Slate Rock and Gravel Company',
                    type: 'Commercial',
                    contact_name: 'Mr. Slate',
                    contact_email: 'slate@quarry.stone',
                    contact_phone: '555-QUARRY',
                    address: '123 Quarry Lane',
                    city: 'Bedrock',
                    state: 'Stone Age',
                    zip: '12345',
                    country: 'Pangaea',
                    status: 'active',
                    industry: 'other',
                    notes: 'Primary quarry operations client',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    name: 'Bedrock City Planning',
                    type: 'Government',
                    contact_name: 'Mayor Boulder',
                    contact_email: 'mayor@bedrock.gov',
                    contact_phone: '555-MAYOR',
                    address: '456 City Hall Drive',
                    city: 'Bedrock',
                    state: 'Stone Age',
                    zip: '12346',
                    country: 'Pangaea',
                    status: 'active',
                    industry: 'government',
                    notes: 'Municipal construction projects',
                    created_by: userId,
                    updated_by: userId,
                },
            ])
            .select();

        if (clientsError) throw clientsError;

        // 5. Create Equipment
        const { data: equipment, error: equipmentError } = await supabase
            .from('equipment')
            .insert([
                {
                    business_id: businessId,
                    name: 'Bronto-Crane',
                    type: 'heavy',
                    make: 'Dino-Tech',
                    model: 'Brontosaurus 3000',
                    year: -10000,
                    serial_number: 'DINO-001',
                    status: 'in_use',
                    purchase_date: '1960-01-01',
                    purchase_price: 50000,
                    current_value: 45000,
                    location: 'Bedrock Quarry',
                    description: 'Heavy-duty brontosaurus-powered crane for lifting large stones',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    name: 'Stone Roller',
                    type: 'medium',
                    make: 'Boulder-Works',
                    model: 'Granite Crusher',
                    year: -9999,
                    serial_number: 'STONE-002',
                    status: 'available',
                    purchase_date: '1960-02-01',
                    purchase_price: 25000,
                    current_value: 22000,
                    location: 'Bedrock Yard',
                    description: 'Large stone roller for road construction and compacting',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    name: 'Pterodactyl Transport',
                    type: 'medium',
                    make: 'Flying-Dino',
                    model: 'Pteranodon Express',
                    year: -9998,
                    serial_number: 'FLY-003',
                    status: 'maintenance',
                    purchase_date: '1960-03-01',
                    purchase_price: 15000,
                    current_value: 12000,
                    location: 'Bedrock Airfield',
                    description: 'Aerial transport for materials and personnel',
                    created_by: userId,
                    updated_by: userId,
                },
            ])
            .select();

        if (equipmentError) throw equipmentError;

        // 6. Create Projects
        const slateClientId = clients?.find(c => c.name === 'Slate Rock and Gravel Company')?.id;
        const bedrockClientId = clients?.find(c => c.name === 'Bedrock City Planning')?.id;

        const { data: projects, error: projectsError } = await supabase
            .from('projects')
            .insert([
                {
                    business_id: businessId,
                    client_id: slateClientId,
                    name: 'Grand Canyon Quarry Expansion',
                    type: 'other',
                    status: 'in_progress',
                    start_date: '2025-01-15',
                    end_date: '2025-06-30',
                    budget: 250000,
                    location: 'Grand Canyon, Bedrock County',
                    description: 'Major quarry expansion project to increase stone production capacity',
                    manager_id: fredId,
                    progress: 35,
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    client_id: bedrockClientId,
                    name: 'Bedrock Main Street Reconstruction',
                    type: 'construction',
                    status: 'planning',
                    start_date: '2025-03-01',
                    end_date: '2025-08-15',
                    budget: 175000,
                    location: 'Main Street, Bedrock City',
                    description: 'Complete reconstruction of Main Street with new stone paving',
                    manager_id: wilmaId,
                    progress: 15,
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    client_id: slateClientId,
                    name: 'Dinosaur Bone Bridge Construction',
                    type: 'construction',
                    status: 'completed',
                    start_date: '2024-09-01',
                    end_date: '2024-12-20',
                    budget: 125000,
                    location: 'Tar Pits Crossing, Bedrock',
                    description: 'Construction of a decorative bridge using authentic dinosaur bones',
                    manager_id: fredId,
                    progress: 100,
                    created_by: userId,
                    updated_by: userId,
                },
            ])
            .select();

        if (projectsError) throw projectsError;

        // 7. Create Project Milestones
        const quarryProjectId = projects?.find(p => p.name === 'Grand Canyon Quarry Expansion')?.id;
        const streetProjectId = projects?.find(p => p.name === 'Bedrock Main Street Reconstruction')?.id;

        const { data: milestones, error: milestonesError } = await supabase
            .from('project_milestones')
            .insert([
                {
                    project_id: quarryProjectId,
                    business_id: businessId,
                    name: 'Site Preparation Complete',
                    due_date: '2025-02-15',
                    status: 'completed',
                    description: 'Clear the site and prepare for excavation',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    project_id: quarryProjectId,
                    business_id: businessId,
                    name: 'Phase 1 Excavation',
                    due_date: '2025-04-01',
                    status: 'in_progress',
                    description: 'Complete first phase of quarry expansion excavation',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    project_id: streetProjectId,
                    business_id: businessId,
                    name: 'Traffic Management Plan',
                    due_date: '2025-02-28',
                    status: 'not_started',
                    description: 'Develop and approve traffic management during construction',
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    project_id: streetProjectId,
                    business_id: businessId,
                    name: 'Old Road Removal',
                    due_date: '2025-04-15',
                    status: 'not_started',
                    description: 'Remove existing road surface and prepare foundation',
                    created_by: userId,
                    updated_by: userId,
                },
            ])
            .select();

        if (milestonesError) throw milestonesError;

        // 8. Create Tasks
        const sitePreparationId = milestones?.find(m => m.name === 'Site Preparation Complete')?.id;
        const excavationId = milestones?.find(m => m.name === 'Phase 1 Excavation')?.id;

        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .insert([
                {
                    business_id: businessId,
                    project_id: quarryProjectId,
                    milestone_id: sitePreparationId,
                    name: 'Clear Vegetation',
                    description: 'Remove all trees and vegetation from the expansion area',
                    status: 'completed',
                    priority: 'high',
                    start_date: '2025-01-15',
                    end_date: '2025-01-25',
                    assigned_to: mainCrewId,
                    progress: 100,
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    project_id: quarryProjectId,
                    milestone_id: sitePreparationId,
                    name: 'Install Safety Barriers',
                    description: 'Set up safety barriers around the work area',
                    status: 'completed',
                    priority: 'high',
                    start_date: '2025-01-26',
                    end_date: '2025-02-05',
                    assigned_to: safetyCrewId,
                    progress: 100,
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    project_id: quarryProjectId,
                    milestone_id: excavationId,
                    name: 'Begin Stone Excavation',
                    description: 'Start excavating stone from the new quarry section',
                    status: 'in_progress',
                    priority: 'high',
                    start_date: '2025-02-16',
                    end_date: '2025-03-30',
                    assigned_to: mainCrewId,
                    progress: 45,
                    created_by: userId,
                    updated_by: userId,
                },
                {
                    business_id: businessId,
                    project_id: streetProjectId,
                    milestone_id: null,
                    name: 'Survey Street Conditions',
                    description: 'Complete detailed survey of current street conditions',
                    status: 'not_started',
                    priority: 'medium',
                    start_date: '2025-02-01',
                    end_date: '2025-02-15',
                    assigned_to: safetyCrewId,
                    progress: 0,
                    created_by: userId,
                    updated_by: userId,
                },
            ])
            .select();

        if (tasksError) throw tasksError;

        // 9. Create Daily Logs
        const { error: dailyLogsError } = await supabase
            .from('daily_logs')
            .insert([
                {
                    business_id: businessId,
                    date: '2025-01-15',
                    project_id: quarryProjectId,
                    crew_id: mainCrewId,
                    weather: JSON.stringify({
                        temperature: 75,
                        condition: 'Sunny',
                        humidity: 40,
                        wind: '5 mph'
                    }),
                    work_completed: 'Started clearing vegetation from the expansion area. Fred and Barney operated the Bronto-Crane to remove large boulders.',
                    work_planned: 'Continue vegetation clearing and begin site grading.',
                    hours_worked: 8,
                    start_time: '07:00',
                    end_time: '16:00',
                    overtime: 0,
                    safety: 'All safety protocols followed. No incidents reported.',
                    quality: 'Work meets specifications. Site clearing progressing well.',
                    delays: 'None',
                    notes: 'Excellent weather conditions. Team morale high. Bamm-Bamm proved very effective at boulder removal.',
                    author_id: userId,
                    created_by: userId,
                    updated_by: userId,
                },
            ]);

        if (dailyLogsError) throw dailyLogsError;

        // 10. Create Invoices
        const { error: invoicesError } = await supabase
            .from('invoices')
            .insert([
                {
                    business_id: businessId,
                    invoice_number: 'INV-2025-001',
                    client_id: slateClientId,
                    project_id: quarryProjectId,
                    amount: 25000,
                    status: 'paid',
                    issue_date: '2025-01-31',
                    due_date: '2025-02-28',
                    paid_date: '2025-02-15',
                    payment_method: 'Stone Coins',
                    notes: 'Payment for site preparation work completed',
                    tax_rate: 0.08,
                    created_by: userId,
                    updated_by: userId,
                },
            ]);

        if (invoicesError) throw invoicesError;

        return {
            success: true,
            message: 'Flintstones seed data created successfully!',
            data: {
                crewMembers: crewMembers?.length || 0,
                crews: crews?.length || 0,
                clients: clients?.length || 0,
                equipment: equipment?.length || 0,
                projects: projects?.length || 0,
                milestones: milestones?.length || 0,
                tasks: tasks?.length || 0,
            }
        };

    } catch (error) {
        console.error('Error seeding Flintstones data:', error);
        throw new Error(`Failed to seed data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
