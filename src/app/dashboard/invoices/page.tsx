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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Invoices</h1>
                    <p className="text-sm text-base-content/50">Manage your invoices efficiently</p>
                </div>
                <div className="flex items-center space-x-6">
                    <Link href={"/dashbaord/invoices/new"} className="btn btn-primary">
                        <i className="fal fa-plus fa-fw mr-2"></i>
                        New Invoice
                    </Link>
                </div>
            </div>

            <Suspense fallback={<div className="loading loading-spinner loading-lg"></div>}>
                <InvoicesList initialInvoices={invoices} />
            </Suspense>
        </div>
    );
}