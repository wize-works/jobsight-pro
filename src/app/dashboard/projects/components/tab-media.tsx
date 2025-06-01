import { Media } from "@/types/media";

export default function MediaTab({ documents }: { documents: Media[] }) {
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Media Documents</h2>
            <p className="text-base-content/70">Here you can manage all media documents related to this project.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                    <div key={doc.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-200">
                        <div className="card-body">
                            <h3 className="card-title">{doc.name}</h3>
                            <p className="text-sm text-base-content/70">{doc.description}</p>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-2">
                                View Document
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}