import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const BillingProcessSchema = z.object({
    daily_log_ids: z.array(z.string().uuid()).min(1, "At least one daily log ID is required"),
    include_labor: z.boolean().optional().default(true),
    include_equipment: z.boolean().optional().default(true),
    include_materials: z.boolean().optional().default(true),
    billing_date: z.string().optional(),
    project_id: z.string().uuid().optional(),
});

const SingleLogBillingSchema = z.object({
    daily_log_id: z.string().uuid(),
    include_labor: z.boolean().optional().default(true),
    include_equipment: z.boolean().optional().default(true),
    include_materials: z.boolean().optional().default(true),
    billing_date: z.string().optional(),
});

interface BillableItem {
    id: string;
    daily_log_id: string;
    type: 'labor' | 'equipment' | 'material';
    source_id: string;
    source_name: string;
    quantity: number;
    unit: string;
    rate: number;
    subtotal: number;
    date: string;
    description?: string;
    metadata?: any;
}

interface BillingSummary {
    daily_log_id: string;
    project_id: string;
    project_name: string;
    date: string;
    total_labor_cost: number;
    total_equipment_cost: number;
    total_material_cost: number;
    total_cost: number;
    billable_items: BillableItem[];
}

// POST /api/daily-log-billing/batch
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ success: false, error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const processingData = BillingProcessSchema.parse(body);

        // Validate all daily logs exist and belong to business
        const { data: dailyLogs, error: logsError } = await supabase
            .from("daily_logs")
            .select(`
                id, project_id, date, hours_worked, overtime,
                projects!inner(id, name, client_id),
                crews(id, name)
            `)
            .in("id", processingData.daily_log_ids)
            .eq("business_id", businessId);

        if (logsError || !dailyLogs || dailyLogs.length !== processingData.daily_log_ids.length) {
            return NextResponse.json({ success: false, error: "One or more daily logs not found" }, { status: 404 });
        }

        const billingSummaries: BillingSummary[] = [];

        for (const log of dailyLogs) {
            const billableItems: BillableItem[] = [];
            let laborCost = 0;
            let equipmentCost = 0;
            let materialCost = 0;

            // Process labor costs if requested
            if (processingData.include_labor && (log.hours_worked || log.overtime)) {
                // Get crew assignments and member rates
                if (log.crews && typeof log.crews === 'object' && 'id' in log.crews) {
                    const { data: assignments } = await supabase
                        .from("crew_member_assignments")
                        .select(`
                            crew_members!inner(id, name, hourly_rate, overtime_rate, is_billable)
                        `)
                        .eq("crew_id", (log.crews as any).id);

                    if (assignments) {
                        for (const assignment of assignments) {
                            const member = (assignment as any).crew_members;
                            if (member?.is_billable && member?.hourly_rate > 0) {
                                const regularHours = Math.min(log.hours_worked || 0, 8);
                                const overtimeHours = Math.max((log.hours_worked || 0) - 8, 0) + (log.overtime || 0);

                                const regularCost = regularHours * member.hourly_rate;
                                const overtimeCost = overtimeHours * (member.overtime_rate || member.hourly_rate * 1.5);
                                const totalCost = regularCost + overtimeCost;

                                laborCost += totalCost;

                                billableItems.push({
                                    id: `labor-${member.id}-${log.id}`,
                                    daily_log_id: log.id,
                                    type: 'labor',
                                    source_id: member.id,
                                    source_name: member.name,
                                    quantity: (log.hours_worked || 0) + (log.overtime || 0),
                                    unit: 'hours',
                                    rate: member.hourly_rate,
                                    subtotal: totalCost,
                                    date: log.date,
                                    description: `Labor: ${member.name}`,
                                    metadata: {
                                        regular_hours: regularHours,
                                        overtime_hours: overtimeHours,
                                        regular_rate: member.hourly_rate,
                                        overtime_rate: member.overtime_rate || member.hourly_rate * 1.5
                                    }
                                });
                            }
                        }
                    }
                }
            }

            // Process equipment costs if requested
            if (processingData.include_equipment) {
                const { data: equipmentUsage } = await supabase
                    .from("daily_log_equipment")
                    .select(`
                        id, equipment_id, hours, name,
                        equipment!inner(id, name, hourly_rate, is_billable)
                    `)
                    .eq("daily_log_id", log.id);

                if (equipmentUsage) {
                    for (const usage of equipmentUsage) {
                        const equipment = (usage as any).equipment;
                        if (equipment?.is_billable && equipment?.hourly_rate > 0 && usage.hours > 0) {
                            const totalCost = usage.hours * equipment.hourly_rate;
                            equipmentCost += totalCost;

                            billableItems.push({
                                id: `equipment-${equipment.id}-${log.id}`,
                                daily_log_id: log.id,
                                type: 'equipment',
                                source_id: equipment.id,
                                source_name: equipment.name,
                                quantity: usage.hours,
                                unit: 'hours',
                                rate: equipment.hourly_rate,
                                subtotal: totalCost,
                                date: log.date,
                                description: `Equipment: ${equipment.name}`,
                                metadata: {
                                    equipment_id: equipment.id,
                                    operator: usage.name
                                }
                            });
                        }
                    }
                }
            }

            // Process material costs if requested
            if (processingData.include_materials) {
                const { data: materials } = await supabase
                    .from("daily_log_materials")
                    .select("id, name, quantity, cost")
                    .eq("daily_log_id", log.id);

                if (materials) {
                    for (const material of materials) {
                        if (material.cost > 0) {
                            materialCost += material.cost;

                            billableItems.push({
                                id: `material-${material.id}-${log.id}`,
                                daily_log_id: log.id,
                                type: 'material',
                                source_id: material.id,
                                source_name: material.name,
                                quantity: material.quantity || 1,
                                unit: 'units',
                                rate: material.cost / (material.quantity || 1),
                                subtotal: material.cost,
                                date: log.date,
                                description: `Material: ${material.name}`,
                                metadata: {
                                    total_quantity: material.quantity,
                                    unit_cost: material.cost / (material.quantity || 1)
                                }
                            });
                        }
                    }
                }
            }

            billingSummaries.push({
                daily_log_id: log.id,
                project_id: log.project_id,
                project_name: (log.projects as any)?.name || 'Unknown Project',
                date: log.date,
                total_labor_cost: laborCost,
                total_equipment_cost: equipmentCost,
                total_material_cost: materialCost,
                total_cost: laborCost + equipmentCost + materialCost,
                billable_items: billableItems
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                billing_summaries: billingSummaries,
                totals: {
                    total_logs_processed: billingSummaries.length,
                    total_labor_cost: billingSummaries.reduce((sum, s) => sum + s.total_labor_cost, 0),
                    total_equipment_cost: billingSummaries.reduce((sum, s) => sum + s.total_equipment_cost, 0),
                    total_material_cost: billingSummaries.reduce((sum, s) => sum + s.total_material_cost, 0),
                    grand_total: billingSummaries.reduce((sum, s) => sum + s.total_cost, 0)
                }
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Daily log billing batch processing error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process daily log billing" },
            { status: 500 }
        );
    }
}

// PUT /api/daily-log-billing/single
export async function PUT(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const processingData = SingleLogBillingSchema.parse(body);

        // Reuse the POST logic but with a single log ID
        const batchRequest = new NextRequest(request.url, {
            method: 'POST',
            headers: request.headers,
            body: JSON.stringify({
                daily_log_ids: [processingData.daily_log_id],
                include_labor: processingData.include_labor,
                include_equipment: processingData.include_equipment,
                include_materials: processingData.include_materials,
                billing_date: processingData.billing_date
            })
        });

        const batchResponse = await POST(batchRequest);
        const batchData = await batchResponse.json();

        if (batchData.success && batchData.data?.billing_summaries?.length > 0) {
            return NextResponse.json({
                success: true,
                data: batchData.data.billing_summaries[0] // Return single summary
            }, { status: 200 });
        } else {
            return NextResponse.json({
                success: false,
                error: "Failed to process single daily log"
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Daily log single billing processing error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process daily log billing" },
            { status: 500 }
        );
    }
}
