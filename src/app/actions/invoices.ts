"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { Invoice, InvoiceInsert, InvoiceUpdate, InvoiceWithClient, InvoiceWithDetails } from "@/types/invoices";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createNotification } from "@/app/actions/notifications";
import { getUsers } from "@/app/actions/users";
import { auth } from "@clerk/nextjs/server";
import type { NotificationInsert } from "@/types/notifications";
import { PLAN_HIERARCHY } from "@/lib/subscription-limits";

// Create notifications for invoice events
async function triggerInvoiceNotification(
    businessId: string,
    invoiceId: string,
    invoiceNumber: string,
    clientName: string,
    eventType: string,
    amount?: number,
    triggeredBy?: string
) {
    try {
        // Get all users in the business
        const users = await getUsers(businessId);

        if (users.length === 0) {
            console.log("No users found for business to notify");
            return;
        }

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

        // Create notifications for all users in the business
        const notificationPromises = users.map(async (user) => {
            // Skip users without auth_id or the user who triggered the action
            if (!user.auth_id || user.auth_id === triggeredBy) {
                return;
            }

            const notificationData: NotificationInsert = {
                user_id: user.auth_id,
                type: "invoiceUpdates",
                title,
                message,
                link: `/dashboard/invoices/${invoiceId}`,
                read: false,
                read_at: null,
                metadata: {
                    invoiceId,
                    invoiceNumber,
                    clientName,
                    eventType,
                    amount,
                    triggeredBy
                }
            };

            return createNotification(businessId, notificationData);
        });

        // Wait for all notifications to be created
        await Promise.all(notificationPromises.filter(Boolean));

    } catch (error) {
        console.error("Error creating invoice notification:", error);
    }
}

export const getInvoices = async (businessId: string): Promise<Invoice[]> => {


    const { data, error } = await fetchByBusiness("invoices", businessId);

    if (error) {
        console.error("Error fetching invoices:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as Invoice[];
    }

    return data as unknown as Invoice[];
}

export const getInvoiceById = async (businessId: string, id: string): Promise<Invoice | null> => {


    const { data, error } = await fetchByBusiness("invoices", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching invoice by ID:", error);
        return null;
    } if (data && data[0]) {
        console.log("Debug: Invoice fetched from database:", JSON.stringify(data[0], null, 2));
        console.log("Debug: Invoice status from DB:", data[0].status);
        return data[0] as unknown as Invoice;
    }

    return null;
};

export const createInvoice = async (businessId: string, invoice: InvoiceInsert): Promise<Invoice | null> => {


    invoice = await applyCreated<InvoiceInsert>(invoice);

    const { data, error } = await insertWithBusiness("invoices", invoice, businessId);

    if (error) {
        console.error("Error creating invoice:", error);
        return null;
    } if (data) {
        // Get the current user session to identify who created the invoice
        const { userId } = await auth();

        // Get client name for notification
        const { data: clientData } = await fetchByBusiness("clients", businessId, ["name"], {
            filter: { id: data.client_id },
        });
        const clientName = clientData?.[0]?.name || "Unknown Client";

        // Trigger notification
        await triggerInvoiceNotification(
            businessId,
            data.id,
            data.invoice_number || "Unknown",
            clientName,
            "created",
            data.amount || undefined,
            userId || undefined
        );
    }

    return data as unknown as Invoice;
}

export const updateInvoice = async (businessId: string, id: string, invoice: InvoiceUpdate): Promise<Invoice | null> => {


    invoice = await applyUpdated<InvoiceUpdate>(invoice);

    const { data, error } = await updateWithBusinessCheck("invoices", id, invoice, businessId);

    if (error) {
        console.error("Error updating invoice:", error);
        return null;
    } if (data) {
        // Get the current user session to identify who updated the invoice
        const { userId } = await auth();

        // Get client name for notification
        const { data: clientData } = await fetchByBusiness("clients", businessId, ["name"], {
            filter: { id: data.client_id },
        });
        const clientName = clientData?.[0]?.name || "Unknown Client";

        // Trigger notification
        await triggerInvoiceNotification(
            businessId,
            data.id,
            data.invoice_number || "Unknown",
            clientName,
            "updated",
            data.amount || undefined,
            userId || undefined
        );
    }

    return data as unknown as Invoice;
}

export const deleteInvoice = async (businessId: string, id: string): Promise<boolean> => {
    try {
        // Get the invoice data before deletion for notification
        const { data: invoiceData } = await fetchByBusiness("invoices", businessId, "*", {
            filter: { id },
        });
        const invoice = invoiceData?.[0] as Invoice | undefined;

        const { error } = await deleteWithBusinessCheck("invoices", id, businessId);

        if (error) {
            console.error("Error deleting invoice:", error);
            return false;
        }

        if (invoice) {
            // Get the current user session to identify who deleted the invoice
            const { userId } = await auth();

            // Get client name for notification
            const { data: clientData } = await fetchByBusiness("clients", businessId, ["name"], {
                filter: { id: invoice.client_id },
            });
            const clientName = clientData?.[0]?.name || "Unknown Client";

            // Trigger notification
            await triggerInvoiceNotification(
                businessId,
                invoice.id,
                invoice.invoice_number || "Unknown",
                clientName,
                "deleted",
                invoice.amount || undefined,
                userId || undefined
            );
        }

        return true;
    } catch (err) {
        console.error("Error in deleteInvoice:", err);
        return false;
    }
}

export const searchInvoices = async (businessId: string, query: string): Promise<Invoice[]> => {


    const { data, error } = await fetchByBusiness("invoices", businessId, "*", {
        filter: {
            or: [
                { invoice_number: { ilike: `%${query}%` } },
                { notes: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "invoice_number", ascending: true },
    });

    if (error) {
        console.error("Error searching invoices:", error);
        return [];
    }

    return data as unknown as Invoice[];
};

export const getInvoicesWithClient = async (businessId: string): Promise<InvoiceWithClient[]> => {


    const { data, error } = await fetchByBusiness("invoices", businessId);

    if (error) {
        console.error("Error fetching invoices:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }
    const clientIds = data.map((invoice: Invoice) => invoice.client_id).filter(id => id);
    const { data: clientData, error: clientError } = await fetchByBusiness("clients", businessId, "*", {
        filter: {
            id: { in: clientIds },
        },
    });

    if (clientError) {
        console.error("Error fetching clients for invoices:", clientError);
        return data as unknown as InvoiceWithClient[];
    }

    const detailData = data.map((invoice: Invoice) => {
        const client = (clientData ?? []).find((client: any) => client.id === invoice.client_id);
        return {
            ...invoice,
            client: client || null,
        } as InvoiceWithClient;
    });

    return detailData;
};

export const getInvoiceWitDetailsById = async (businessId: string, id: string): Promise<InvoiceWithDetails | null> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("invoices", businessId, "*", { filter: { id: id } });

    if (error) {
        console.error("Error fetching invoices:", error);
        return null;
    }

    if (!data || data.length === 0) {
        return null;
    }

    const { data: itemsData, error: itemsError } = await fetchByBusiness("invoice_items", businessId, "*", {
        filter: {
            invoice_id: { eq: id },
        },
    });

    const clientIds = data.map((invoice: Invoice) => invoice.client_id).filter(id => id);
    const { data: clientData, error: clientError } = await fetchByBusiness("clients", businessId, "*", {
        filter: {
            id: { in: clientIds },
        },
    });

    if (clientError) {
        console.error("Error fetching clients for invoices:", clientError);
        return data[0] as unknown as InvoiceWithDetails;
    }

    const projectId = data[0].project_id;
    const { data: project, error: projectError } = await fetchByBusiness("projects", businessId, "*", {
        filter: { id: projectId },
    });    // Check subscription level for branding privileges
    const { data: subscriptionData } = await fetchByBusiness("business_subscriptions", businessId, "*", {
        filter: { business_id: businessId },
        orderBy: { column: "created_at", ascending: false },
        limit: 1,
    });

    const currentSubscription = subscriptionData?.[0];
    const currentPlan = currentSubscription?.plan_id || 'personal';
    const currentPlanLevel = PLAN_HIERARCHY[currentPlan as keyof typeof PLAN_HIERARCHY] || 0;
    const hasCustomBranding = currentPlanLevel >= PLAN_HIERARCHY.pro;

    const detailData = data.map((invoice: Invoice) => {
        const client = (clientData ?? []).find((client: any) => client.id === invoice.client_id);
        return {
            ...invoice,
            items: itemsData || [],
            client: client || null,
            project: (project?.[0]) || null,
            billing_address: {
                name: client?.name,
                attention: client?.contact_name || null,
                street: client?.address || null,
                city: client?.city || null,
                state: client?.state || null,
                zip: client?.zip || null,
                country: client?.country || null,
            },
            business_info: {
                // Only include custom business branding if subscription allows it
                name: hasCustomBranding ? business.name : "JobSight Pro",
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
            }
        } as InvoiceWithDetails;
    });

    return detailData[0] || null;
};

