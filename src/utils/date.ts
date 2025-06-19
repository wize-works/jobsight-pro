/**
 * Date utility functions for consistent date formatting across the application
 */

/**
 * Formats a date string consistently across the application
 * Handles timezone issues by treating date-only strings as local dates
 */
export function formatDate(dateString?: string | null): string {
    if (!dateString) return "Not set";

    try {
        let date: Date;

        // If the date string is in YYYY-MM-DD format (date-only), 
        // treat it as a local date to avoid timezone issues
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            date = new Date(year, month - 1, day); // month is 0-indexed
        } else {
            date = new Date(dateString);
        }

        // Validate the date
        if (isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    } catch (error) {
        return dateString;
    }
}

/**
 * Formats a date string for use in HTML date inputs (YYYY-MM-DD format)
 * Ensures the date is treated as local to avoid timezone shifts
 */
export function formatDateForInput(dateString?: string | null): string {
    if (!dateString) return "";

    try {
        let date: Date;

        // If the date string is in YYYY-MM-DD format, treat it as local
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            date = new Date(year, month - 1, day);
        } else {
            date = new Date(dateString);
        }

        if (isNaN(date.getTime())) {
            return "";
        }

        // Format as YYYY-MM-DD for input fields
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    } catch (error) {
        return "";
    }
}

/**
 * Formats currency consistently across the application
 */
export function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return "$0";
    if (isNaN(amount)) return "$0";

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(amount);
}
