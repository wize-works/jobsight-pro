
"use client";
import { useState, useEffect } from "react";
import { TaskNote, TaskNoteInsert } from "@/types/task-notes";
import { useBusiness } from "@/lib/business-context";

type NotesSectionProps = {
    dailyLogId: string;
};

export default function NotesSection({ dailyLogId }: NotesSectionProps) {
    const { businessId } = useBusiness();
    const [notes, setNotes] = useState<TaskNote[]>([]);
    const [newNote, setNewNote] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadNotes = async () => {
            if (!businessId || !dailyLogId) return;

            try {
                const response = await fetch(`/api/tasks?action=get-notes&id=${encodeURIComponent(dailyLogId)}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch task notes');
                }

                const result = await response.json();
                if (result.success) {
                    setNotes(result.notes || []);
                } else {
                    console.error('Error loading notes:', result.error);
                    setNotes([]);
                }
            } catch (error) {
                console.error('Error loading notes:', error);
                setNotes([]);
            }
        };
        loadNotes();
    }, [dailyLogId, businessId]);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        setLoading(true);
        try {
            const noteData = {
                task_id: dailyLogId,
                content: newNote.trim(),
            };

            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create-note',
                    note: noteData,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to create note');
            }

            const result = await response.json();
            if (result.success) {
                // Reload notes to get the updated list
                const notesResponse = await fetch(`/api/tasks?action=get-notes&id=${encodeURIComponent(dailyLogId)}`);
                if (notesResponse.ok) {
                    const notesResult = await notesResponse.json();
                    if (notesResult.success) {
                        setNotes(notesResult.notes || []);
                    }
                }
                setNewNote("");
            } else {
                throw new Error(result.error || 'Failed to create note');
            }
        } catch (error) {
            console.error("Error adding note:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="card bg-base-200 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title">Notes</h3>
                    <div className="whitespace-pre-line min-h-[200px]">
                        {notes.length === 0 ? (
                            "No notes were recorded for this daily log."
                        ) : (
                            <div className="space-y-6">
                                {notes.map((note) => (
                                    <div key={note.id} className="bg-base-100 p-3 rounded">
                                        <p className="text-sm">{note.content}</p>
                                        <p className="text-xs text-base-content/60 mt-2">
                                            {note.created_at ? new Date(note.created_at).toLocaleString() : "Unknown date"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="form-control">
                <label className="label">
                    <span className="label-text font-semibold">Add a note</span>
                </label>
                <textarea
                    className="textarea textarea-bordered h-24"
                    placeholder="Add additional notes here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                ></textarea>
                <div className="mt-2 flex justify-end">
                    <button
                        className="btn btn-primary"
                        onClick={handleAddNote}
                        disabled={loading || !newNote.trim()}
                    >
                        {loading ? (
                            <>
                                <span className="loading loading-spinner loading-sm mr-2"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="far fa-save mr-2"></i>
                                Save Note
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
