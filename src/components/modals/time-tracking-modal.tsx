"use client"

import { useState, useEffect } from 'react';
import { formatDate } from '@/utils/formatters';

interface TimeTrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TimeEntry {
    id: string;
    startTime: Date;
    endTime?: Date;
    description: string;
    projectId?: string;
    projectName?: string;
    duration?: number; // in minutes
}

export default function TimeTrackingModal({ isOpen, onClose }: TimeTrackingModalProps) {
    const [isTracking, setIsTracking] = useState(false);
    const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
    const [description, setDescription] = useState('');
    const [elapsedTime, setElapsedTime] = useState(0);
    const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);

    // Load saved data from localStorage on component mount
    useEffect(() => {
        const savedEntry = localStorage.getItem('activeTimeEntry');
        const savedEntries = localStorage.getItem('recentTimeEntries');

        if (savedEntry) {
            const entry = JSON.parse(savedEntry);
            entry.startTime = new Date(entry.startTime);
            setCurrentEntry(entry);
            setIsTracking(true);
            setDescription(entry.description);
        }

        if (savedEntries) {
            const entries = JSON.parse(savedEntries);
            entries.forEach((entry: any) => {
                entry.startTime = new Date(entry.startTime);
                if (entry.endTime) entry.endTime = new Date(entry.endTime);
            });
            setRecentEntries(entries);
        }
    }, []);

    // Update elapsed time every second when tracking
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isTracking && currentEntry) {
            interval = setInterval(() => {
                const now = new Date();
                const elapsed = Math.floor((now.getTime() - currentEntry.startTime.getTime()) / 1000);
                setElapsedTime(elapsed);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTracking, currentEntry]);

    const startTracking = () => {
        const newEntry: TimeEntry = {
            id: `time-${Date.now()}`,
            startTime: new Date(),
            description: description || 'Work session'
        };

        setCurrentEntry(newEntry);
        setIsTracking(true);
        setElapsedTime(0);

        // Save to localStorage for persistence
        localStorage.setItem('activeTimeEntry', JSON.stringify(newEntry));
    };

    const stopTracking = () => {
        if (!currentEntry) return;

        const endTime = new Date();
        const duration = Math.floor((endTime.getTime() - currentEntry.startTime.getTime()) / 60000); // in minutes

        const completedEntry: TimeEntry = {
            ...currentEntry,
            endTime,
            duration,
            description: description || currentEntry.description
        };

        // Add to recent entries
        const updatedEntries = [completedEntry, ...recentEntries.slice(0, 9)]; // Keep last 10 entries
        setRecentEntries(updatedEntries);

        // Save to localStorage
        localStorage.setItem('recentTimeEntries', JSON.stringify(updatedEntries));
        localStorage.removeItem('activeTimeEntry');

        // Reset state
        setCurrentEntry(null);
        setIsTracking(false);
        setElapsedTime(0);
        setDescription('');

        // TODO: Here you would typically sync with your backend API
        console.log('Time entry completed:', completedEntry);
    };

    const pauseTracking = () => {
        // For now, just stop tracking. Could be enhanced to support pause/resume
        stopTracking();
    };

    const formatElapsedTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-2xl p-0">
                {/* Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">Time Tracking</h2>
                            <p className="text-primary-content/80 text-sm mt-1">
                                Track your work time and manage recent entries
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            aria-label="Close modal"
                        >
                            <i className="far fa-times text-lg"></i>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
                    {/* Current Tracking Section */}
                    <div className="card bg-base-100 border border-base-300 shadow-sm">
                        <div className="card-body p-4">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <i className="far fa-clock text-primary"></i>
                                {isTracking ? 'Active Session' : 'Start New Session'}
                            </h3>

                            {!isTracking ? (
                                <div className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">What are you working on? *</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered input-secondary"
                                            placeholder="e.g., Project planning, Site inspection..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        className="btn btn-primary btn-lg w-full gap-2"
                                        onClick={startTracking}
                                        disabled={!description.trim()}
                                    >
                                        <i className="fas fa-play"></i>
                                        Start Tracking
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="text-center bg-base-200 p-6 rounded-lg">
                                        <div className="text-4xl font-mono font-bold text-primary mb-2">
                                            {formatElapsedTime(elapsedTime)}
                                        </div>
                                        <p className="text-base-content/70 text-sm">
                                            Started at {currentEntry?.startTime.toLocaleTimeString()}
                                        </p>
                                        <p className="font-medium mt-2">
                                            {currentEntry?.description}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <button
                                            className="btn btn-error gap-2"
                                            onClick={stopTracking}
                                        >
                                            <i className="fas fa-stop"></i>
                                            Stop & Save
                                        </button>
                                        <button
                                            className="btn btn-outline gap-2"
                                            onClick={pauseTracking}
                                        >
                                            <i className="fas fa-pause"></i>
                                            Finish Session
                                        </button>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Update description</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered input-secondary"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Entries Section */}
                    {recentEntries.length > 0 && (
                        <div className="card bg-base-100 border border-base-300 shadow-sm">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-history text-primary"></i>
                                    Recent Time Entries
                                </h3>

                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {recentEntries.map((entry) => (
                                        <div key={entry.id} className="flex justify-between items-center p-3 bg-base-200 rounded-lg border">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">{entry.description}</p>
                                                <p className="text-xs text-base-content/70 mt-1">
                                                    <i className="far fa-calendar-alt mr-1"></i>
                                                    {formatDate(entry.startTime.toISOString())}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-primary">
                                                    <i className="far fa-clock mr-1"></i>
                                                    {entry.duration ? formatDuration(entry.duration) : 'In progress'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    <div className="flex justify-end gap-3">
                        <button
                            className="btn btn-outline"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
