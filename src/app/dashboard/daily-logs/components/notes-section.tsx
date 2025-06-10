
"use client";
import { useState, useEffect } from "react";
import { getTaskNotes, createTaskNote } from "@/app/actions/task-notes";
import { TaskNote, TaskNoteInsert } from "@/types/task-notes";

type NotesSectionProps = {
    dailyLogId: string;
};

export default function NotesSection({ dailyLogId }: NotesSectionProps) {
    const [notes, setNotes] = useState<TaskNote[]>([]);
    const [newNote, setNewNote] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadNotes = async () => {
            const taskNotes = await getTaskNotes();
            // Filter notes related to this daily log if needed
            setNotes(taskNotes);
        };
        loadNotes();
    }, [dailyLogId]);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        setLoading(true);
        try {
            const noteData: TaskNoteInsert = {
                id: crypto.randomUUID(),
                task_id: dailyLogId, // Using daily log ID as task ID for now
                content: newNote.trim(),
                business_id: "", // This will be set by the server action
                created_by: "", // This will be set by the server action
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            } as TaskNoteInsert;

            const createdNote = await createTaskNote(noteData);
            if (createdNote) {
                setNotes([...notes, createdNote]);
                setNewNote("");
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
