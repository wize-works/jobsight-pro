"use client"

import Link from "next/link"

export default function MorePage() {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">More Options</h1>

            <div className="grid gap-4">
                <div className="divider mb-0">Organization</div>
                <Link href="/dashboard/business" className="btn btn-ghost justify-start">
                    <i className="fal fa-building fa-fw fa-lg mr-3"></i>
                    Business
                </Link>
                <Link href="/dashboard/crews" className="btn btn-ghost justify-start">
                    <i className="fal fa-users fa-fw fa-lg mr-3"></i>
                    Crews
                </Link>
                <Link href="/dashboard/equipment" className="btn btn-ghost justify-start">
                    <i className="fal fa-excavator fa-fw fa-lg mr-3"></i>
                    Equipment
                    <span className="badge badge-sm badge-accent ml-auto">New</span>
                </Link>

                <div className="divider mb-0">Projects</div>
                <Link href="/dashboard/daily-logs" className="btn btn-ghost justify-start">
                    <i className="fal fa-clipboard-list fa-fw fa-lg mr-3"></i>
                    Daily Logs
                </Link>

                <div className="divider mb-0">Finance</div>
                <Link href="/dashboard/invoices" className="btn btn-ghost justify-start">
                    <i className="fal fa-file-invoice-dollar fa-fw fa-lg mr-3"></i>
                    Invoices
                </Link>
                <Link href="/dashboard/reports" className="btn btn-ghost justify-start">
                    <i className="fal fa-chart-bar fa-fw fa-lg mr-3"></i>
                    Reports
                </Link>

                <div className="divider mb-0">Media</div>
                <Link href="/dashboard/media" className="btn btn-ghost justify-start">
                    <i className="fal fa-images fa-fw fa-lg mr-3"></i>
                    Media Library
                </Link>

                <div className="divider mb-0">Settings</div>
                <Link href="/dashboard/profile" className="btn btn-ghost justify-start">
                    <i className="fal fa-user fa-fw fa-lg mr-3"></i>
                    Profile
                </Link>
                <Link href="/dashboard/settings" className="btn btn-ghost justify-start">
                    <i className="fal fa-cog fa-fw fa-lg mr-3"></i>
                    Settings
                </Link>
            </div>
        </div>
    )
}