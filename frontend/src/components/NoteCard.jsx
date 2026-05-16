import { Pin, Pencil, Trash2, Share2, Tag } from "lucide-react";

export default function NoteCard({ note, onEdit, onDelete, onShare, onPin }) {
  const formattedDate = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-3 transition hover:shadow-md ${note.isPinned ? "border-brand-500 ring-1 ring-brand-200" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 flex-1">
          {note.title}
        </h3>
        <button
          onClick={() => onPin(note)}
          title={note.isPinned ? "Unpin" : "Pin"}
          className={`shrink-0 p-1 rounded-lg transition ${note.isPinned ? "text-brand-600 bg-brand-50" : "text-gray-400 hover:text-brand-500 hover:bg-brand-50"}`}
        >
          <Pin size={15} />
        </button>
      </div>

      <p className="text-gray-600 text-sm line-clamp-3 flex-1">{note.content}</p>

      {note.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {note.tags.map((tag) => (
            <span key={tag.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              <Tag size={10} /> {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <span className="text-xs text-gray-400">{formattedDate}</span>
        <div className="flex gap-1">
          <button onClick={() => onShare(note)} title="Share" className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition">
            <Share2 size={15} />
          </button>
          <button onClick={() => onEdit(note)} title="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition">
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(note)} title="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
