import { useState, useEffect, useCallback } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import NoteCard from "../components/NoteCard";
import NoteModal from "../components/NoteModal";
import ShareModal from "../components/ShareModal";
import { useAuth } from "../context/AuthContext";
import { Plus, Search, X } from "lucide-react";

export default function NotesPage() {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [sharingNote, setSharingNote] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchNotes = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/notes?page=${page}&limit=12`);
      setNotes(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.data);
    } catch {
      toast.error("Search failed");
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const handleSave = async ({ title, content, tags }) => {
    try {
      if (editingNote?.id) {
        await api.put(`/notes/${editingNote.id}`, { title, content, tags });
        toast.success("Note updated");
      } else {
        await api.post("/notes", { title, content, tags });
        toast.success("Note created");
      }
      setShowModal(false);
      setEditingNote(null);
      fetchNotes(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save note");
    }
  };

  const handleDelete = async (note) => {
    if (!confirm(`Delete "${note.title}"?`)) return;
    try {
      await api.delete(`/notes/${note.id}`);
      toast.success("Note moved to trash");
      fetchNotes(pagination.page);
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handlePin = async (note) => {
    try {
      await api.put(`/notes/${note.id}`, { isPinned: !note.isPinned });
      fetchNotes(pagination.page);
    } catch {
      toast.error("Failed to update note");
    }
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setShowModal(true);
  };

  const openNew = () => {
    setEditingNote(null);
    setShowModal(true);
  };

  const displayedNotes = searchResults ?? notes;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Notes</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
        >
          <Plus size={16} /> New Note
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition">
          Search
        </button>
        {searchResults && (
          <button type="button" onClick={clearSearch} className="px-3 py-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        )}
      </form>

      {searchResults && (
        <p className="text-sm text-gray-500">
          {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
        </p>
      )}

      {/* Notes grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-40 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : displayedNotes.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">No notes yet</p>
          <p className="text-sm mt-1">Click "New Note" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              isOwner={note.owner?.id === currentUser?.id}
              onEdit={openEdit}
              onDelete={handleDelete}
              onShare={setSharingNote}
              onPin={handlePin}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!searchResults && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchNotes(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition ${p === pagination.page
                ? "bg-brand-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <NoteModal
          note={editingNote}
          onClose={() => { setShowModal(false); setEditingNote(null); }}
          onSave={handleSave}
        />
      )}
      {sharingNote && (
        <ShareModal note={sharingNote} onClose={() => setSharingNote(null)} />
      )}
    </div>
  );
}
