import { useNavigate } from "react-router-dom";

export function AdminSidebar() {
  const navigate = useNavigate();

  return (
    <div className="w-64 bg-slate-900/80 border-r border-slate-800 p-4 backdrop-blur">
      <div className="flex items-center gap-2 mb-8">
        <img src="/urent.png" className="w-8 h-8" />
        <span className="text-white font-bold">U-Rent</span>
      </div>
      <div className="space-y-2">
        <button
          onClick={() => navigate("/admin")}
          className="w-full text-left px-3 py-2 rounded-xl text-white bg-cyan-500/10 border border-cyan-500/20"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
