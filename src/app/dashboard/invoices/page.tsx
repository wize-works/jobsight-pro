import { getInvoices, getInvoicesWithClient } from '@/app/actions/invoices';
import InvoicesList from './components/list';
import { Suspense } from 'react';
import Link from 'next/link';
import { withBusinessServer } from '@/lib/auth/with-business-server';

// Updated to use `businessId` for server-side actions
export default async function InvoicesPage() {
    const { business } = await withBusinessServer();
    const businessId = business.id;

    // Fetch invoices data on the server
    const invoices = await getInvoicesWithClient(businessId);

    return (
        <div className="container mx-auto">

            <Suspense fallback={<div className="loading loading-spinner loading-lg"></div>}>
                <InvoicesList initialInvoices={invoices} />
            </Suspense>
        </div>
    );
}