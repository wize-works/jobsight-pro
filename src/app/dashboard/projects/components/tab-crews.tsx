import { getCrewsByProjectId, getAvailableCrews } from "@/app/actions/crews";
import { getCrewMemberById } from "@/app/actions/crew-members";
import { Crew, CrewWithMemberInfo } from "@/types/crews";
import { set } from "date-fns";
import Link from "next/link";
import { useEffect, useState } from "react";
import { removeCrewFromProject } from "@/app/actions/project-crews";

export default function CrewsTab({ projectId, crews }: { projectId: string, crews: CrewWithMemberInfo[] }) {
    const [loading, setLoading] = useState(true);
    const [availableCrews, setAvailableCrews] = useState<CrewWithMemberInfo[]>([]);

    useEffect(() => {
        async function loadCrews() {
            try {
                setLoading(true);
                const available = await getAvailableCrews();

                setAvailableCrews(available);

            } catch (error) {
                console.error("Error loading crews:", error);
            } finally {
                setLoading(false);
            }
        }

        loadCrews();
    }, [crews]);


    if (loading) {
        return (
            <div className="">
                {/* Assigned Crews Skeleton */}
                <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card bg-base-100 shadow-sm animate-pulse">
                                <div className="card-body">
                                    <div className="flex items-center justify-between space-x-6">
                                        <div className="skeleton h-5 w-32"></div>
                                        <div className="skeleton h-4 w-20"></div>
                                    </div>
                                    <div className="skeleton h-3 w-40 mt-2"></div>
                                    <div className="flex justify-end space-x-6 mt-4">
                                        <div className="skeleton h-8 w-16"></div>
                                        <div className="skeleton h-8 w-20"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="divider my-6 skeleton h-3 w-full"></div>

                {/* Available Crews Skeleton */}
                <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="card bg-base-100 shadow-sm animate-pulse">
                                <div className="card-body">
                                    <div className="flex items-center justify-between space-x-6">
                                        <div className="skeleton h-5 w-32"></div>
                                        <div className="skeleton h-4 w-20"></div>
                                    </div>
                                    <div className="skeleton h-3 w-40 mt-2"></div>
                                    <div className="flex justify-end space-x-6 mt-4">
                                        <div className="skeleton h-8 w-16"></div>
                                        <div className="skeleton h-8 w-20"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            {loading ? (
                <div className="loading loading-spinner loading-lg"></div>
            ) : crews.length === 0 ? (
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <h2 className="card-title">No crews assigned yet</h2>
                        <p className="text-base-content/70">Start by creating a new crew to manage your project effectively.</p>
                    </div>
                </div>
            ) : (
                <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {crews.map((crew) => (
                            <div key={crew.id} className="card bg-base-100 shadow-sm flex justify-between">
                                <div className="card-body">
                                    <div className="flex items-center justify-between space-x-6">
                                        <div className="text-lg font-semibold">{crew.name}</div>
                                        <div className="badge badge-outline">{crew.member_count} members</div>
                                    </div>
                                    <div className="text-sm text-base-content/70">
                                        {!crew.leader_name ? "No leader assigned" : `Led by ${crew.leader_name}`}
                                    </div>
                                    <div className="flex justify-end space-x-6">
                                        <Link href={`/dashboard/crews/${crew.id}`} className="btn btn-sm btn-ghost">
                                            <i className="fas fa-eye"></i>
                                            View
                                        </Link>
                                        <button className="btn btn-sm btn-error" onClick={async () => {
                                            await removeCrewFromProject(projectId, crew.id);
                                        }}>
                                            <i className="fas fa-user-minus"></i>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="divider my-6">Available Crews</div>

            {availableCrews.length > 0 && (
                <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {availableCrews.map((crew) => (
                            <div key={crew.id} className="card bg-base-100 shadow-sm flex justify-between">
                                <div className="card-body">
                                    <div className="flex items-center justify-between space-x-6">
                                        <div className="text-lg font-semibold">{crew.name}</div>
                                        <div className="badge badge-outline">{crew.member_count} members</div>
                                    </div>
                                    <div className="text-sm text-base-content/70">
                                        {!crew.leader_name ? "No leader assigned" : `Led by ${crew.leader_name}`}
                                    </div>
                                    <div className="flex justify-end space-x-6">
                                        <Link href={`/dashboard/crews/${crew.id}`} className="btn btn-sm btn-ghost">
                                            <i className="fas fa-eye"></i>
                                            View
                                        </Link>
                                        <button className="btn btn-sm btn-success" onClick={() => {
                                            // Handle crew assignment logic here
                                        }}>
                                            <i className="fas fa-user-plus"></i>
                                            Assign
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div >
    );
};