import InvoiceDetail from "../components/detail";

// Mock data for a single invoice
const mockInvoice = {
    id: "INV-2025-001",
    client: "Oakridge Development",
    clientId: "client1",
    project: "Main Street Development",
    projectId: "proj1",
    amount: 12500.0,
    status: "paid",
    issueDate: "2025-04-15",
    dueDate: "2025-05-15",
    paidDate: "2025-05-10",
    paymentMethod: "Credit Card",
    notes: "Payment for Phase 1 completion of the Main Street Development project.",
    items: [
        {
            id: "item1",
            description: "Foundation Work",
            quantity: 1,
            unitPrice: 5000.0,
            amount: 5000.0,
        },
        {
            id: "item2",
            description: "Framing Labor",
            quantity: 80,
            unitPrice: 75.0,
            amount: 6000.0,
        },
        {
            id: "item3",
            description: "Materials - Lumber",
            quantity: 1,
            unitPrice: 1500.0,
            amount: 1500.0,
        },
    ],
    billingAddress: {
        name: "Oakridge Development",
        attention: "Michael Thompson",
        street: "123 Corporate Blvd",
        city: "Anytown",
        state: "CA",
        zip: "90210",
        country: "USA",
    },
    companyInfo: {
        name: "JobSight Construction",
        street: "456 Builder Ave",
        city: "Anytown",
        state: "CA",
        zip: "90210",
        country: "USA",
        phone: "(555) 987-6543",
        email: "billing@jobsight.com",
        website: "www.jobsight.com",
        taxId: "12-3456789",
    },
    paymentInstructions: {
        bankName: "First National Bank",
        accountName: "JobSight Construction LLC",
        accountNumber: "XXXX-XXXX-7890",
        routingNumber: "XXXX-XXXX",
        swift: "FNBAUS12",
    },
}

// In a real application, you would fetch the invoice data based on the id parameter
export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
    // Here you would typically fetch the invoice data from your database or API
    // const invoice = await fetchInvoice(params.id);
    
    // For now, we're using the mock data
    const invoice = mockInvoice;
    
    return <InvoiceDetail invoice={invoice} />;
}
