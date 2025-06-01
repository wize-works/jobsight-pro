import React from "react";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
            <h2 className="text-lg font-semibold">Loading Project Details...</h2>
            <p className="text-base-content/70 mt-2">Please wait while we fetch the project information.</p>
        </div>
    );
}