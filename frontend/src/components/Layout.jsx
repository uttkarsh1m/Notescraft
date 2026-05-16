import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotebookPen, Trash2, LogOut } from "lucide-react";

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-brand-600 font-bold text-xl">
          <NotebookPen size={24} />
          <span>Notes</span>
        </div>
        <nav className="flex items-center gap-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                isActive ? "bg-brand-50 text-brand-600" : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <NotebookPen size={16} /> My Notes
          </NavLink>
          <NavLink
            to="/trash"
            className={({ isActive }) =>
              `flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                isActive ? "bg-brand-50 text-brand-600" : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <Trash2 size={16} /> Trash
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </nav>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
