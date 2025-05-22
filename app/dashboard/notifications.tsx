import Link from "next/link";

export const Notifications = () => {
    return (
        <div className="dropdown dropdown-end">
            <div className="indicator">
                <div tabIndex={0} role="button" className="btn btn-circle relative">
                    <i className="fas fa-bell"></i>
                    <span className="badge badge-xs badge-primary indicator-item indicator-bottom">3</span>
                </div>
            </div>
            <div tabIndex={0} className="mt-3 z-[1] card card-compact w-80 dropdown-content bg-base-100 shadow">
                <div className="card-body">
                    <span className="font-bold text-lg">3 Notifications</span>
                    <div className="text-sm">
                        <div className="py-2 border-b">
                            <p className="font-semibold">Equipment inspection due</p>
                            <p className="text-xs">Excavator #103 - Today</p>
                        </div>
                        <div className="py-2 border-b">
                            <p className="font-semibold">Task assigned</p>
                            <p className="text-xs">Foundation work - Main St Project</p>
                        </div>
                        <div className="py-2">
                            <p className="font-semibold">Invoice paid</p>
                            <p className="text-xs">Johnson Residence - $3,450</p>
                        </div>
                    </div>
                    <div className="card-actions">
                        <Link href="/dashboard/notifications" className="btn btn-primary btn-block btn-sm">
                            View all
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}