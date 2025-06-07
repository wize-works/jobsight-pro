export default function ModalPayment({ onClose, total = 0 }: { onClose?: () => void, total: number }) {
    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Record Payment</h3>
                <div className="form-control mb-4 w-full">
                    <label className="label">
                        <span className="label-text">Payment Date</span>
                    </label>
                    <input
                        type="date"
                        className="input input-bordered w-full"
                        defaultValue={new Date().toISOString().split("T")[0]}
                    />
                </div>
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Payment Method</span>
                    </label>
                    <select className="select select-bordered w-full">
                        <option>Credit Card</option>
                        <option>Bank Transfer</option>
                        <option>Check</option>
                        <option>Cash</option>
                        <option>Other</option>
                    </select>
                </div>
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Amount</span>
                    </label>
                    <input type="number" className="input input-bordered w-full" defaultValue={total} />
                </div>
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Reference Number</span>
                    </label>
                    <input type="text" className="input input-bordered w-full" placeholder="e.g., Check #, Transaction ID" />
                </div>
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text">Notes</span>
                    </label>
                    <textarea className="textarea textarea-bordered w-full" placeholder="Add payment notes"></textarea>
                </div>
                <div className="modal-action">
                    <button className="btn" onClick={() => onClose?.()}>
                        Cancel
                    </button>
                    <button className="btn btn-success">
                        Record Payment
                    </button>
                </div>
            </div>
        </div>
    );
}