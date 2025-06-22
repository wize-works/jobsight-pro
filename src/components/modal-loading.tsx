interface ModalLoadingProps {
    message?: string;
    icon?: 'spinner' | 'fontawesome';
}

export default function ModalLoading({
    message = "Loading...",
    icon = 'spinner'
}: ModalLoadingProps) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
                {icon === 'fontawesome' ? (
                    <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
                ) : (
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                )}
                <p className="text-base-content/70 font-medium">{message}</p>
            </div>
        </div>
    );
}
