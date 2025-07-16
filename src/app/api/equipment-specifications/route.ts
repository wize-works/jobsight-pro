import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const SpecificationQuerySchema = z.object({
    include: z.string().optional(),
    equipment_id: z.string().optional(),
    specification: z.string().optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

const SpecificationCreateSchema = z.object({
    equipment_id: z.string().min(1, "Equipment ID is required"),
    specification: z.string().min(1, "Specification name is required"),
    value: z.string().min(1, "Value is required"),
    unit: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    is_critical: z.boolean().optional().default(false),
    min_value: z.string().optional(),
    max_value: z.string().optional(),
    tolerance: z.string().optional(),
});

const SpecificationUpdateSchema = SpecificationCreateSchema.partial();

// GET /api/equipment-specifications
export async function GET(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const { searchParams } = new URL(request.url);
        const params = SpecificationQuerySchema.parse(Object.fromEntries(searchParams));

        let query = supabase
            .from("equipment_specifications")
            .select("*")
            .eq("business_id", businessId);

        // Apply filters
        if (params.equipment_id) {
            query = query.eq("equipment_id", params.equipment_id);
        }

        if (params.specification) {
            query = query.ilike("specification", `%${params.specification}%`);
        }

        if (params.category) {
            query = query.eq("category", params.category);
        }

        if (params.search) {
            query = query.or(`specification.ilike.%${params.search}%,value.ilike.%${params.search}%,description.ilike.%${params.search}%`);
        }

        // Apply pagination
        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
        }

        // Default ordering
        query = query.order("specification", { ascending: true });

        const { data: specifications, error } = await query;

        if (error) {
            console.error("Equipment specifications fetch error:", error);
            return NextResponse.json({ error: "Failed to fetch specifications" }, { status: 500 });
        }

        // Handle includes
        if (params.include && specifications) {
            const includes = params.include.split(",");

            for (const specification of specifications) {
                // Add equipment details
                if (includes.includes("equipment")) {
                    const { data: equipment } = await supabase
                        .from("equipment")
                        .select("*")
                        .eq("id", specification.equipment_id)
                        .single();

                    (specification as any).equipment = equipment;
                }

                // Add related specifications
                if (includes.includes("related")) {
                    const { data: related } = await supabase
                        .from("equipment_specifications")
                        .select("*")
                        .eq("equipment_id", specification.equipment_id)
                        .eq("category", specification.category)
                        .neq("id", specification.id)
                        .order("specification", { ascending: true })
                        .limit(5);

                    (specification as any).related = related || [];
                }

                // Add validation info
                if (includes.includes("validation")) {
                    const validation = {
                        has_min_max: !!(specification.min_value && specification.max_value),
                        has_tolerance: !!specification.tolerance,
                        is_within_range: true, // This would need actual validation logic
                        critical_status: specification.is_critical ? "critical" : "normal"
                    };

                    // Check if current value is within min/max range
                    if (specification.min_value && specification.max_value) {
                        const currentValue = parseFloat(specification.value);
                        const minValue = parseFloat(specification.min_value);
                        const maxValue = parseFloat(specification.max_value);

                        if (!isNaN(currentValue) && !isNaN(minValue) && !isNaN(maxValue)) {
                            validation.is_within_range = currentValue >= minValue && currentValue <= maxValue;
                        }
                    }

                    (specification as any).validation = validation;
                }

                // Add history
                if (includes.includes("history")) {
                    // This would typically come from a specifications_history table
                    // For now, we'll provide a placeholder structure
                    (specification as any).history = [];
                }
            }
        }

        return NextResponse.json({
            data: specifications,
            count: specifications?.length || 0
        });

    } catch (error) {
        console.error("Equipment specifications API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch specifications" },
            { status: 500 }
        );
    }
}

// POST /api/equipment-specifications
export async function POST(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const specificationData = SpecificationCreateSchema.parse(body);

        // Validate equipment exists and belongs to business
        const { data: equipment } = await supabase
            .from("equipment")
            .select("id")
            .eq("id", specificationData.equipment_id)
            .eq("business_id", businessId)
            .single();

        if (!equipment) {
            return NextResponse.json({ error: "Equipment not found" }, { status: 404 });
        }

        // Check for duplicate specifications
        const { data: existingSpec } = await supabase
            .from("equipment_specifications")
            .select("id")
            .eq("equipment_id", specificationData.equipment_id)
            .eq("specification", specificationData.specification)
            .single();

        if (existingSpec) {
            return NextResponse.json(
                { error: "Specification already exists for this equipment" },
                { status: 409 }
            );
        }

        const { data: specification, error } = await supabase
            .from("equipment_specifications")
            .insert({
                ...specificationData,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Equipment specification creation error:", error);
            return NextResponse.json({ error: "Failed to create specification" }, { status: 500 });
        }

        return NextResponse.json({
            data: specification,
            message: "Specification created successfully"
        });

    } catch (error) {
        console.error("Equipment specification creation error:", error);
        return NextResponse.json(
            { error: "Failed to create specification" },
            { status: 500 }
        );
    }
}

// PUT /api/equipment-specifications
export async function PUT(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: "Specification ID is required" }, { status: 400 });
        }

        const specificationData = SpecificationUpdateSchema.parse(updateData);

        // Validate specification exists and belongs to business
        const { data: existingSpec } = await supabase
            .from("equipment_specifications")
            .select("*")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingSpec) {
            return NextResponse.json({ error: "Specification not found" }, { status: 404 });
        }

        const { data: specification, error } = await supabase
            .from("equipment_specifications")
            .update({
                ...specificationData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("business_id", businessId)
            .select()
            .single();

        if (error) {
            console.error("Equipment specification update error:", error);
            return NextResponse.json({ error: "Failed to update specification" }, { status: 500 });
        }

        return NextResponse.json({
            data: specification,
            message: "Specification updated successfully"
        });

    } catch (error) {
        console.error("Equipment specification update error:", error);
        return NextResponse.json(
            { error: "Failed to update specification" },
            { status: 500 }
        );
    }
}

// DELETE /api/equipment-specifications
export async function DELETE(request: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
        }

        // Get user's business
        const { data: userBusiness } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", user.id)
            .single();

        if (!userBusiness) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const businessId = userBusiness.business_id;
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Specification ID is required" }, { status: 400 });
        }

        // Validate specification exists and belongs to business
        const { data: existingSpec } = await supabase
            .from("equipment_specifications")
            .select("id")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingSpec) {
            return NextResponse.json({ error: "Specification not found" }, { status: 404 });
        }

        const { error } = await supabase
            .from("equipment_specifications")
            .delete()
            .eq("id", id)
            .eq("business_id", businessId);

        if (error) {
            console.error("Equipment specification deletion error:", error);
            return NextResponse.json({ error: "Failed to delete specification" }, { status: 500 });
        }

        return NextResponse.json({
            message: "Specification deleted successfully"
        });

    } catch (error) {
        console.error("Equipment specification deletion error:", error);
        return NextResponse.json(
            { error: "Failed to delete specification" },
            { status: 500 }
        );
    }
}
