export default function TabSafety({ safety, quality, delays }: { safety: string | null, quality: string | null, delays: string | null }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Safety Information */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-success">
                        <i className="far fa-shield-check mr-2"></i>
                        Safety Information
                    </h3>
                    <div className="space-y-6">
                        {safety ?? <div className="text-base-content/50">YAY! No safety information provided.</div>}
                    </div>
                </div>
            </div>

            {/* Quality Control */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-info">
                        <i className="far fa-clipboard-check mr-2"></i>
                        Quality Control
                    </h3>
                    <div className="space-y-6">
                        {quality ?? <div className="text-base-content/50">No quality control information provided.</div>}
                    </div>
                </div>
            </div>

            {/* Delays & Issues */}
            <div className="lg:col-span-2">
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h3 className="card-title text-warning">
                            <i className="far fa-exclamation-triangle mr-2"></i>
                            Delays & Issues
                        </h3>
                        <div className="space-y-6">
                            {delays ?? <div className="text-base-content/50">No delays or issues reported.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}