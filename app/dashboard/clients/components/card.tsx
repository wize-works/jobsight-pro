import { ClientWithStats } from "@/types/clients";
import { StatusOptions } from "./list";
import Link from "next/link";
export const ClientCard = ({ client }: {
    client: ClientWithStats
}) => {
    return (
        <div key={client.id} className="card bg-base-100 shadow-sm">
            <div className="card-body">
                <div className="flex justify-between">
                    <div className="flex justify-between">
                        <div className="avatar">
                            <div className="w-12 h-12 rounded-full bg-base-300 text-center content-center">
                                {client.logo_url ? (
                                    <img src={client.logo_url || "/placeholder.svg"} alt={`${client.name} logo`} />
                                ) : (
                                    <span className="text-xl font-bold">{client.name.charAt(0)}</span>
                                )}
                            </div>
                        </div>
                        <div className="ml-4">
                            <h2 className="card-title">{client.name}</h2>
                            <p className="text-sm opacity-50">{client.type}</p>
                        </div>
                    </div>
                    <span className={`badge ${StatusOptions[client?.status || "prospect"]?.color || "badge-neutral"}`}>
                        {StatusOptions[client?.status || "prospect"]?.label || "Unknown"}
                    </span>
                </div>
                <p><i className="fas fa-user fa-fw mr-2" />{client.contact_name}</p>
                <p className="text-sm opacity-50"><i className="fas fa-envelope fa-fw mr-2" />{client.contact_email}</p>
                <p className="text-sm opacity-50"><i className="fas fa-phone fa-fw mr-2" />{client.contact_phone}</p>
                <div className="card-actions justify-end mt-4">
                    <Link href={`/dashboard/clients/${client.id}`} className="btn btn-sm btn-outline">
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}