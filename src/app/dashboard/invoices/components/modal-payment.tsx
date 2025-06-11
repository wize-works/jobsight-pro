"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";

interface ModalPaymentProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onSubmit?: (paymentData: any) => void;
}

export default function ModalPayment({ isOpen, onClose, total = 0, onSubmit }: ModalPaymentProps) {
    const [formData, setFormData] = useState({
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "",
        amount: total,
        reference_number: "",
        notes: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numValue = value === "" ? 0 : Number(value);
        setFormData(prev => ({
            ...prev,
            [name]: numValue
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (onSubmit) {
                await onSubmit(formData);
            }
            toast.success({
                title: "Success",
                description: "Payment recorded successfully"
            });
            onClose();
        } catch (err: any) {
            const errorMessage = err.message || "Failed to record payment";
            setError(errorMessage);
            toast.error({
                title: "Error",
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[90vh] p-0 rounded-lg">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            Record Payment
                        </h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Payment Information */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-credit-card text-primary"></i>
                                    Payment Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Payment Date *</span>
                                        </label>
                                        <input
                                            type="date"
                                            name="payment_date"
                                            className="input input-bordered input-secondary"
                                            value={formData.payment_date}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Payment Method *</span>
                                        </label>
                                        <select
                                            name="payment_method"
                                            className="select select-bordered select-secondary"
                                            value={formData.payment_method}
                                            onChange={handleInputChange}
                                            required
                                            disabled={loading}
                                        >
                                            <option value="">Select payment method</option>
                                            <option value="credit_card">Credit Card</option>
                                            <option value="debit_card">Debit Card</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="wire_transfer">Wire Transfer</option>
                                            <option value="ach">ACH</option>
                                            <option value="check">Check</option>
                                            <option value="cash">Cash</option>
                                            <option value="paypal">PayPal</option>
                                            <option value="stripe">Stripe</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Amount *</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-base-200">$</span>
                                            <input
                                                type="number"
                                                name="amount"
                                                className="input input-bordered input-secondary flex-1"
                                                value={formData.amount}
                                                onChange={handleNumberInputChange}
                                                placeholder="0.00"
                                                min="0"
                                                step="0.01"
                                                required
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Reference Number</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="reference_number"
                                            className="input input-bordered input-secondary"
                                            value={formData.reference_number}
                                            onChange={handleInputChange}
                                            placeholder="e.g., Check #, Transaction ID, Confirmation #"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-calculator text-primary"></i>
                                    Payment Summary
                                </h3>
                                <div className="bg-base-50 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-base-content/70">Invoice Total:</span>
                                        <span className="font-semibold">{formatCurrency(total)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-base-content/70">Payment Amount:</span>
                                        <span className="font-semibold text-success">{formatCurrency(formData.amount)}</span>
                                    </div>
                                    <div className="divider my-2"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-base-content/70">Remaining Balance:</span>
                                        <span className="font-bold text-lg">
                                            {formatCurrency((total - formData.amount))}
                                        </span>
                                    </div>
                                    {formData.amount >= total && (
                                        <div className="alert alert-success mt-3">
                                            <i className="fas fa-check-circle"></i>
                                            <span>This payment will mark the invoice as paid in full</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Additional Notes */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-sticky-note text-primary"></i>
                                    Additional Notes
                                </h3>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Payment Notes</span>
                                    </label>
                                    <textarea
                                        name="notes"
                                        className="textarea textarea-bordered textarea-secondary"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        placeholder="Add any additional notes about this payment..."
                                        rows={4}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="fas fa-exclamation-triangle"></i>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-success gap-2"
                            onClick={handleSubmit}
                            disabled={loading || !formData.payment_method || !formData.amount}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Recording...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-dollar-sign"></i>
                                    Record Payment
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}