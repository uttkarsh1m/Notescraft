import { useState } from "react";
import { X, Share2 } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function ShareModal({ note, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/notes/${note.id}/share`, { share_with_email: email });
      toast.success(`Note shared with ${email}`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to share note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Share2 size={18} /> Share Note
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleShare} className="p-6 flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            Share <span className="font-medium">"{note.title}"</span> with another user.
          </p>
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition disabled:opacity-60"
            >
              {loading ? "Sharing..." : "Share"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
