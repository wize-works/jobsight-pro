import { Crew, CrewWithDetails } from "@/types/crews";
import Link from "next/link";
import { useState } from "react";

export const CrewCard = ({
    crew,
}: {
    crew: CrewWithDetails;
}) => {

    return (
        <div key={crew.id} className="card bg-base-100 shadow-lg rounded-lg">
            <div className="card-body">
                <div className="flex justify-between items-start">
                    <h2 className="card-title">{crew.name}</h2>
                    <div className={`badge ${crew.status === "active" ? "badge-primary" : "badge-success"}`}>
                        {crew.status === "active" ? "Active" : "Available"}
                    </div>
                </div>
                <div className="mt-2">
                    <p className="flex items-center">
                        <i className={`far fa-buildings fa-fw mr-2 ${crew.leader !== "No Leader" ? "text-primary" : ""}`}></i> {crew.leader}
                    </p>
                    <p className="flex items-center mt-1">
                        <i className={`far fa-users fa-fw mr-2 ${(crew.member_count ?? 0) > 0 ? "text-primary" : "text-base-content"}`}></i> {(crew.member_count ?? 0)} members
                    </p>
                    {crew.current_project && (
                        <p className="flex items-center mt-1">
                            {!crew.current_project_id ? (
                                <><i className="far fa-screwdriver-wrench mr-2 text-base-content"></i> {crew.current_project}</>
                            ) : (
                                <Link href={`/dashboard/projects/${crew.current_project_id}`} className="text-primary">
                                    <i className="far fa-screwdriver-wrench fa-fw mr-2 text-primary"></i> {crew.current_project}
                                </Link>
                            )}
                        </p>
                    )}
                </div>
                <div className="card-actions justify-end mt-4">
                    <Link href={`/dashboard/crews/${crew.id}`} className="btn btn-sm btn-outline">
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}