import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const InvoiceQuerySchema = z.object({
    include: z.string().optional(),
    client_id: z.string().optional(),
    project_id: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    limit: z.coerce.number().optional(),
    offset: z.coerce.number().optional(),
});

const InvoiceCreateSchema = z.object({
    client_id: z.string().min(1, "Client ID is required"),
    project_id: z.string().optional(),
    invoice_number: z.string().min(1, "Invoice number is required"),
    invoice_date: z.string().min(1, "Invoice date is required"),
    due_date: z.string().optional(),
    amount: z.coerce.number().min(0, "Amount must be non-negative"),
    tax_amount: z.coerce.number().optional(),
    discount_amount: z.coerce.number().optional(),
    total_amount: z.coerce.number().min(0, "Total amount must be non-negative"),
    status: z.string().optional().default("draft"),
    notes: z.string().optional(),
    terms: z.string().optional(),
    payment_terms: z.string().optional(),
    currency: z.string().optional().default("USD"),
});

const InvoiceUpdateSchema = InvoiceCreateSchema.partial();

// GET /api/invoices
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
        const params = InvoiceQuerySchema.parse(Object.fromEntries(searchParams));

        let query = supabase
            .from("invoices")
            .select("*")
            .eq("business_id", businessId);

        // Apply filters
        if (params.client_id) {
            query = query.eq("client_id", params.client_id);
        }

        if (params.project_id) {
            query = query.eq("project_id", params.project_id);
        }

        if (params.status) {
            query = query.eq("status", params.status);
        }

        if (params.search) {
            query = query.or(`invoice_number.ilike.%${params.search}%,notes.ilike.%${params.search}%`);
        }

        if (params.start_date) {
            query = query.gte("invoice_date", params.start_date);
        }

        if (params.end_date) {
            query = query.lte("invoice_date", params.end_date);
        }

        // Apply pagination
        if (params.limit) {
            query = query.limit(params.limit);
        }

        if (params.offset) {
            query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
        }

        // Default ordering
        query = query.order("invoice_date", { ascending: false });

        const { data: invoices, error } = await query;

        if (error) {
            console.error("Invoices fetch error:", error);
            return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
        }

        // Handle includes
        if (params.include && invoices) {
            const includes = params.include.split(",");

            for (const invoice of invoices) {
                // Add client details
                if (includes.includes("client")) {
                    const { data: client } = await supabase
                        .from("clients")
                        .select("*")
                        .eq("id", invoice.client_id)
                        .single();

                    (invoice as any).client = client;
                }

                // Add project details
                if (includes.includes("project") && invoice.project_id) {
                    const { data: project } = await supabase
                        .from("projects")
                        .select("*")
                        .eq("id", invoice.project_id)
                        .single();

                    (invoice as any).project = project;
                }

                // Add invoice items
                if (includes.includes("items")) {
                    const { data: items } = await supabase
                        .from("invoice_items")
                        .select("*")
                        .eq("invoice_id", invoice.id)
                        .order("created_at", { ascending: true });

                    (invoice as any).items = items || [];
                }

                // Add detailed information (client + items + project + business info)
                if (includes.includes("details")) {
                    // Get client
                    const { data: client } = await supabase
                        .from("clients")
                        .select("*")
                        .eq("id", invoice.client_id)
                        .single();

                    // Get items
                    const { data: items } = await supabase
                        .from("invoice_items")
                        .select("*")
                        .eq("invoice_id", invoice.id)
                        .order("created_at", { ascending: true });

                    // Get project if exists
                    let project = null;
                    if (invoice.project_id) {
                        const { data: projectData } = await supabase
                            .from("projects")
                            .select("*")
                            .eq("id", invoice.project_id)
                            .single();
                        project = projectData;
                    }

                    // Get business info
                    const { data: business } = await supabase
                        .from("businesses")
                        .select("*")
                        .eq("id", businessId)
                        .single();

                    // Check subscription for custom branding
                    const { data: subscription } = await supabase
                        .from("business_subscriptions")
                        .select("*")
                        .eq("business_id", businessId)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .single();

                    const hasCustomBranding = subscription?.plan_id &&
                        ["pro", "enterprise"].includes(subscription.plan_id);

                    (invoice as any).client = client;
                    (invoice as any).items = items || [];
                    (invoice as any).project = project;
                    (invoice as any).billing_address = {
                        name: client?.name,
                        attention: client?.contact_name || null,
                        street: client?.address || null,
                        city: client?.city || null,
                        state: client?.state || null,
                        zip: client?.zip || null,
                        country: client?.country || null,
                    };
                    (invoice as any).business_info = {
                        name: hasCustomBranding ? business?.name : "JobSight Pro",
                        street: hasCustomBranding ? business?.address || null : null,
                        city: hasCustomBranding ? business?.city || null : null,
                        state: hasCustomBranding ? business?.state || null : null,
                        zip: hasCustomBranding ? business?.zip || null : null,
                        country: hasCustomBranding ? business?.country || null : null,
                        phone: hasCustomBranding ? business?.phone || null : null,
                        email: hasCustomBranding ? business?.email || null : "support@jobsight.co",
                        website: hasCustomBranding ? business?.website || null : "https://jobsight.co",
                        tax_id: hasCustomBranding ? business?.tax_id || null : null,
                        logo_url: hasCustomBranding ? business?.logo_url || null : null,
                    };
                }

                // Add calculated totals
                if (includes.includes("totals")) {
                    const { data: items } = await supabase
                        .from("invoice_items")
                        .select("quantity, rate, discount_amount, tax_amount")
                        .eq("invoice_id", invoice.id);

                    const subtotal = items?.reduce((sum, item) =>
                        sum + ((item.quantity || 0) * (item.rate || 0)), 0) || 0;
                    const totalDiscount = items?.reduce((sum, item) =>
                        sum + (item.discount_amount || 0), 0) || 0;
                    const totalTax = items?.reduce((sum, item) =>
                        sum + (item.tax_amount || 0), 0) || 0;
                    const total = subtotal - totalDiscount + totalTax;

                    (invoice as any).calculated_totals = {
                        subtotal,
                        total_discount: totalDiscount,
                        total_tax: totalTax,
                        total,
                    };
                }
            }
        }

        return NextResponse.json({
            data: invoices,
            count: invoices?.length || 0
        });

    } catch (error) {
        console.error("Invoices API error:", error);
        return NextResponse.json(
            { error: "Failed to fetch invoices" },
            { status: 500 }
        );
    }
}

// POST /api/invoices
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
        const invoiceData = InvoiceCreateSchema.parse(body);

        // Validate client exists and belongs to business
        const { data: client } = await supabase
            .from("clients")
            .select("id, name")
            .eq("id", invoiceData.client_id)
            .eq("business_id", businessId)
            .single();

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        // Validate project if provided
        if (invoiceData.project_id) {
            const { data: project } = await supabase
                .from("projects")
                .select("id")
                .eq("id", invoiceData.project_id)
                .eq("business_id", businessId)
                .single();

            if (!project) {
                return NextResponse.json({ error: "Project not found" }, { status: 404 });
            }
        }

        const { data: invoice, error } = await supabase
            .from("invoices")
            .insert({
                ...invoiceData,
                business_id: businessId,
                created_by: user.id,
                updated_by: user.id,
            })
            .select()
            .single();

        if (error) {
            console.error("Invoice creation error:", error);
            return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
        }

        // Create notification for invoice creation
        await createInvoiceNotification(
            businessId,
            invoice.id,
            invoice.invoice_number,
            client.name,
            "created",
            invoice.amount,
            user.id
        );

        return NextResponse.json({
            data: invoice,
            message: "Invoice created successfully"
        });

    } catch (error) {
        console.error("Invoice creation error:", error);
        return NextResponse.json(
            { error: "Failed to create invoice" },
            { status: 500 }
        );
    }
}

// PUT /api/invoices
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
            return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
        }

        const invoiceData = InvoiceUpdateSchema.parse(updateData);

        // Validate invoice exists and belongs to business
        const { data: existingInvoice } = await supabase
            .from("invoices")
            .select("*")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingInvoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        const { data: invoice, error } = await supabase
            .from("invoices")
            .update({
                ...invoiceData,
                updated_by: user.id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .eq("business_id", businessId)
            .select()
            .single();

        if (error) {
            console.error("Invoice update error:", error);
            return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
        }

        // Get client name for notification
        const { data: client } = await supabase
            .from("clients")
            .select("name")
            .eq("id", invoice.client_id)
            .single();

        // Create notification for invoice update
        await createInvoiceNotification(
            businessId,
            invoice.id,
            invoice.invoice_number,
            client?.name || "Unknown Client",
            "updated",
            invoice.amount,
            user.id
        );

        return NextResponse.json({
            data: invoice,
            message: "Invoice updated successfully"
        });

    } catch (error) {
        console.error("Invoice update error:", error);
        return NextResponse.json(
            { error: "Failed to update invoice" },
            { status: 500 }
        );
    }
}

// DELETE /api/invoices
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
            return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
        }

        // Get invoice data before deletion for notification
        const { data: existingInvoice } = await supabase
            .from("invoices")
            .select("*")
            .eq("id", id)
            .eq("business_id", businessId)
            .single();

        if (!existingInvoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        const { error } = await supabase
            .from("invoices")
            .delete()
            .eq("id", id)
            .eq("business_id", businessId);

        if (error) {
            console.error("Invoice deletion error:", error);
            return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
        }

        // Get client name for notification
        const { data: client } = await supabase
            .from("clients")
            .select("name")
            .eq("id", existingInvoice.client_id)
            .single();

        // Create notification for invoice deletion
        await createInvoiceNotification(
            businessId,
            existingInvoice.id,
            existingInvoice.invoice_number,
            client?.name || "Unknown Client",
            "deleted",
            existingInvoice.amount,
            user.id
        );

        return NextResponse.json({
            message: "Invoice deleted successfully"
        });

    } catch (error) {
        console.error("Invoice deletion error:", error);
        return NextResponse.json(
            { error: "Failed to delete invoice" },
            { status: 500 }
        );
    }
}

// Helper function to create invoice notifications
async function createInvoiceNotification(
    businessId: string,
    invoiceId: string,
    invoiceNumber: string,
    clientName: string,
    eventType: string,
    amount?: number,
    triggeredBy?: string
) {
    try {
        const supabase = createServerClient();
        if (!supabase) return;

        // Get all users in the business
        const { data: users } = await supabase
            .from("users")
            .select("auth_id, first_name, last_name")
            .eq("business_id", businessId);

        if (!users || users.length === 0) return;

        let title = "";
        let message = "";

        switch (eventType) {
            case "created":
                title = "New Invoice Created";
                message = `Invoice ${invoiceNumber} has been created for ${clientName}${amount ? ` ($${amount.toFixed(2)})` : ''}.`;
                break;
            case "updated":
                title = "Invoice Updated";
                message = `Invoice ${invoiceNumber} for ${clientName} has been updated.`;
                break;
            case "sent":
                title = "Invoice Sent";
                message = `Invoice ${invoiceNumber} has been sent to ${clientName}.`;
                break;
            case "paid":
                title = "Invoice Paid";
                message = `Invoice ${invoiceNumber} from ${clientName} has been marked as paid.`;
                break;
            case "overdue":
                title = "Invoice Overdue";
                message = `Invoice ${invoiceNumber} for ${clientName} is now overdue.`;
                break;
            case "deleted":
                title = "Invoice Deleted";
                message = `Invoice ${invoiceNumber} for ${clientName} has been deleted.`;
                break;
            default:
                title = "Invoice Updated";
                message = `Invoice ${invoiceNumber} for ${clientName} has been modified.`;
        }

        // Create notifications for all users except the one who triggered it
        const notificationPromises = users
            .filter(user => user.auth_id !== triggeredBy)
            .map(async (user) => {
                const { error } = await supabase
                    .from("notifications")
                    .insert({
                        business_id: businessId,
                        user_id: user.auth_id,
                        type: "invoiceUpdates",
                        title,
                        message,
                        link: `/dashboard/invoices/${invoiceId}`,
                        read: false,
                        metadata: {
                            invoiceId,
                            invoiceNumber,
                            clientName,
                            eventType,
                            amount,
                            triggeredBy
                        }
                    });

                if (error) {
                    console.error("Error creating notification:", error);
                }
            });

        await Promise.all(notificationPromises);
    } catch (error) {
        console.error("Error creating invoice notification:", error);
    }
}
