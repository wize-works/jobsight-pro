import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const InvoiceItemQuerySchema = z.object({
    include: z.string().optional(),
    invoice_id: z.string().optional(),
    search: z.string().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

const InvoiceItemCreateSchema = z.object({
    invoice_id: z.string().min(1, "Invoice ID is required"),
    description: z.string().min(1, "Description is required"),
    quantity: z.coerce.number().min(0, "Quantity must be non-negative"),
    rate: z.coerce.number().min(0, "Rate must be non-negative"),
    amount: z.coerce.number().min(0, "Amount must be non-negative"),
    tax_rate: z.coerce.number().optional(),
    tax_amount: z.coerce.number().optional(),
    discount_rate: z.coerce.number().optional(),
    discount_amount: z.coerce.number().optional(),
    notes: z.string().optional(),
});

const InvoiceItemUpdateSchema = InvoiceItemCreateSchema.partial();

const BulkUpsertSchema = z.object({
    items: z.array(InvoiceItemCreateSchema.extend({
        id: z.string().optional(),
    })),
});

// GET /api/invoice-items
export async function GET(request: NextRequest) {
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
        const { searchParams } = new URL(request.url);
        const params = InvoiceItemQuerySchema.parse(Object.fromEntries(searchParams));

        let query = supabase
            .from("invoice_items")
            .select("*")
            .eq("business_id", businessId);

        // Apply filters
        if (params.invoice_id) {
            query = query.eq("invoice_id", params.invoice_id);
        }

        if (params.search) {
            query = query.ilike("description", `%${params.search}%`);
        }

        // Apply pagination
        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
        }

        // Default ordering
        query = query.order("created_at", { ascending: true });

        const { data: invoiceItems, error } = await query;

        if (error) {
            console.error("Invoice items fetch error:", error);
            return NextResponse.json({ success: false, error: "Failed to fetch invoice items" }, { status: 500 });
        }

        // Handle includes
        if (params.include && invoiceItems) {
            const includes = params.include.split(",");

            for (const item of invoiceItems) {
                // Add invoice details
                if (includes.includes("invoice")) {
                    const { data: invoice } = await supabase
                        .from("invoices")
                        .select("*")
                        .eq("id", item.invoice_id)
                        .single();

                    (item as any).invoice = invoice;
                }

                // Add calculated totals
                if (includes.includes("totals")) {
                    const subtotal = (item.quantity || 0) * (item.rate || 0);
                    const discountAmount = item.discount_amount || 0;
                    const taxAmount = item.tax_amount || 0;
                    const total = subtotal - discountAmount + taxAmount;

                    (item as any).totals = {
                        subtotal,
                        discount_amount: discountAmount,
                        tax_amount: taxAmount,
                        total,
                    };
                }
            }
        }

        return NextResponse.json({
            success: true,
            data: invoiceItems,
            count: invoiceItems?.length || 0
        }, { status: 200 });

    } catch (error) {
        console.error("Invoice items API error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch invoice items" },
            { status: 500 }
        );
    }
}

// POST /api/invoice-items
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
        const invoiceItemData = InvoiceItemCreateSchema.parse(body);

        // Validate invoice exists and belongs to business
        const { data: invoice } = await supabase
            .from("invoices")
            .select("id")
            .eq("id", invoiceItemData.invoice_id)
            .eq("business_id", businessId)
            .single();

        if (!invoice) {
            return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        }

        const { data: invoiceItem, error } = await supabase
            .from("invoice_items")
            .insert({
                ...invoiceItemData,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Invoice item creation error:", error);
            return NextResponse.json({ success: false, error: "Failed to create invoice item" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: invoiceItem,
            message: "Invoice item created successfully"
        }, { status: 201 });

    } catch (error) {
        console.error("Invoice item creation error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to create invoice item" },
            { status: 500 }
        );
    }
}

// PUT /api/invoice-items
export async function PUT(request: NextRequest) {
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
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: "Invoice item ID is required" }, { status: 400 });
        }

        const invoiceItemData = InvoiceItemUpdateSchema.parse(updateData);

        // Validate invoice item exists and belongs to business
        const { data: existingItem } = await supabase
            .from("invoice_items")
            .select("*")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingItem) {
            return NextResponse.json({ success: false, error: "Invoice item not found" }, { status: 404 });
        }

        const { data: invoiceItem, error } = await supabase
            .from("invoice_items")
            .update({
                ...invoiceItemData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("business_id", businessId)
            .select()
            .single();

        if (error) {
            console.error("Invoice item update error:", error);
            return NextResponse.json({ success: false, error: "Failed to update invoice item" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: invoiceItem,
            message: "Invoice item updated successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Invoice item update error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update invoice item" },
            { status: 500 }
        );
    }
}

// DELETE /api/invoice-items
export async function DELETE(request: NextRequest) {
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
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, error: "Invoice item ID is required" }, { status: 400 });
        }

        // Validate invoice item exists and belongs to business
        const { data: existingItem } = await supabase
            .from("invoice_items")
            .select("id")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingItem) {
            return NextResponse.json({ success: false, error: "Invoice item not found" }, { status: 404 });
        }

        const { error } = await supabase
            .from("invoice_items")
            .delete()
            .eq("id", id)
            .eq("business_id", businessId);

        if (error) {
            console.error("Invoice item deletion error:", error);
            return NextResponse.json({ success: false, error: "Failed to delete invoice item" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "Invoice item deleted successfully"
        }, { status: 204 });

    } catch (error) {
        console.error("Invoice item deletion error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete invoice item" },
            { status: 500 }
        );
    }
}

// PATCH /api/invoice-items - Bulk upsert (create/update multiple items)
export async function PATCH(request: NextRequest) {
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
        const { items } = BulkUpsertSchema.parse(body);

        if (!items || items.length === 0) {
            return NextResponse.json({ success: false, error: "No items provided" }, { status: 400 });
        }

        const results = [];

        for (const item of items) {
            try {
                if (item.id) {
                    // Update existing item
                    const { data: updatedItem, error } = await supabase
                        .from("invoice_items")
                        .update({
                            ...item,
                            updated_by: user.id,
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", item.id)
                        .eq("business_id", businessId)
                        .select()
                        .single();

                    if (error) {
                        console.error("Error updating invoice item:", error);
                        results.push({ success: false, item_id: item.id, error: error.message });
                    } else {
                        results.push({ success: true, data: updatedItem });
                    }
                } else {
                    // Create new item
                    const { data: newItem, error } = await supabase
                        .from("invoice_items")
                        .insert({
                            ...item,
                            business_id: businessId,
                            created_by: user.id,
                            updated_by: user.id,
                        })
                        .select()
                        .single();

                    if (error) {
                        console.error("Error creating invoice item:", error);
                        results.push({ success: false, error: error.message });
                    } else {
                        results.push({ success: true, data: newItem });
                    }
                }
            } catch (itemError) {
                console.error("Error processing item:", itemError);
                results.push({
                    success: false,
                    item_id: item.id,
                    error: itemError instanceof Error ? itemError.message : "Unknown error"
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: true,
            message: `Processed ${items.length} items: ${successCount} successful, ${failureCount} failed`,
            results,
            success_count: successCount,
            failure_count: failureCount
        }, { status: 200 });

    } catch (error) {
        console.error("Bulk upsert error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process bulk upsert" },
            { status: 500 }
        );
    }
}
