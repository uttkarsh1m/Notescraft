import { useState, useEffect } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";

export default function TrashPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notes/trash");
      setNotes(data);
    } catch {
      toast.error("Failed to load trash");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, []);

  const handleRestore = async (note) => {
    try {
      await api.post(`/notes/${note.id}/restore`);
      toast.success("Note restored");
      fetchTrash();
    } catch {
      toast.error("Failed to restore note");
    }
  };

  const handlePermanentDelete = async (note) => {
    if (!confirm(`Permanently delete "${note.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/notes/${note.id}/trash`);
      toast.success("Note permanently deleted");
      fetchTrash();
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const getDaysColor = (days) => {
    if (days <= 3) return "text-red-500 bg-red-50";
    if (days <= 7) return "text-orange-500 bg-orange-50";
    return "text-gray-400 bg-gray-100";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Trash2 size={22} className="text-gray-500" />
        <h1 className="text-2xl font-bold text-gray-900">Trash</h1>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <span>Notes in trash are <strong>permanently deleted after 30 days</strong>. Restore them before they expire.</span>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Trash2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Trash is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div key={note.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 opacity-80">
              <h3 className="font-semibold text-gray-700 line-clamp-1">{note.title}</h3>
              <p className="text-gray-500 text-sm line-clamp-2 flex-1">{note.content}</p>

              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400">
                    Deleted {new Date(note.deletedAt).toLocaleDateString()}
                  </span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full w-fit ${getDaysColor(note.daysRemaining)}`}>
                    {note.daysRemaining === 0
                      ? "Expires today"
                      : `${note.daysRemaining} day${note.daysRemaining !== 1 ? "s" : ""} left`}
                  </span>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleRestore(note)}
                    title="Restore"
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1.5 rounded-lg hover:bg-brand-50 transition"
                  >
                    <RotateCcw size={13} /> Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(note)}
                    title="Delete permanently"
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1.5 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
