import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../layout/AdminLayout";
import {
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  QrCode,
  AlertOctagon,
  UserX,
  CheckSquare,
  Mail,
  User,
  Clock
} from "lucide-react";

export function AdminOrdersDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const messages = [
    {
      sender: "Người thuê",
      text: "Em đã chuyển khoản rồi ạ.",
      time: "09:12",
      mine: false,
    },
    {
      sender: "Người cho thuê",
      text: "Anh đã nhận được nhé.",
      time: "09:15",
      mine: true,
    },
    {
      sender: "Người thuê",
      text: "Khi nào em có thể nhận đồ vậy ạ?",
      time: "09:18",
      mine: false,
    },
    {
      sender: "Người cho thuê",
      text: "Chiều nay sau 5h nhé.",
      time: "09:20",
      mine: true,
    },
  ];

  const rentalHistory = [
    {
      id: "MXTU-12",
      item: "Canon Camera",
      status: "Đã trả",
      date: "2/12/2026",
    },
    {
      id: "MXTU-29",
      item: "Macbook Pro",
      status: "Đã trả",
      date: "3/18/2026",
    },
    {
      id: "MXTU-55",
      item: "Sony A7 IV",
      status: "Đang thuê",
      date: "5/17/2026",
    },
  ];

  return (
    <AdminLayout>
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0%; opacity: 0.8; }
          50% { top: 96%; opacity: 0.8; }
        }
        .scan-line {
          animation: scan 2.5s linear infinite;
        }
      `}</style>

      <div className="space-y-8">
        {/* BACK NAVIGATION AND TITLE */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <button
              onClick={() => navigate("/admin/orders")}
              className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-xs font-bold text-slate-300 transition duration-200 hover:text-white hover:bg-slate-900 hover:border-slate-700"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to Orders
            </button>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Order Dispute Management
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">
              Audit secure escrow chat logs, QR pickup codes, and enforce system security controls
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 px-6 py-4 shadow-lg shadow-cyan-950/15">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order Reference</p>
            <h2 className="mt-1.5 text-2xl font-black text-cyan-400">#{id}</h2>
          </div>
        </div>

        {/* METRICS ROW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* RENTER AUDIT */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Renter Profile</p>
              <h2 className="mt-4 text-2xl font-extrabold text-white">Nguyễn Trọng Tiến</h2>
              <div className="flex items-center gap-2 text-slate-500 mt-2 text-xs font-medium">
                <Mail className="h-3.5 w-3.5" />
                <span>tienarena2k@gmail.com</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 self-start rounded-xl bg-teal-500/10 border border-teal-500/25 px-3 py-1.5 text-xs font-extrabold text-teal-400">
              <ShieldCheck className="h-4 w-4" />
              100% Trust Verified
            </div>
          </div>

          {/* RENTAL TIME METRICS */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Rental Period</p>
              <div className="mt-4 flex items-center gap-2.5">
                <span className="rounded-xl bg-yellow-500/10 border border-yellow-500/25 px-3 py-1.5 text-xs font-extrabold text-yellow-400">
                  Đang thuê
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Pick-up Date</span>
                <span className="text-white">5/17/2026</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Return Deadline</span>
                <span className="text-white">5/24/2026</span>
              </div>
            </div>
          </div>

          {/* ACTIVE NEON SCANNING MOCKUP */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Escrow Verification QR</p>
            </div>

            <div className="relative mt-4 flex h-36 items-center justify-center rounded-xl border border-dashed border-cyan-500/20 bg-slate-950/40 p-4">
              {/* Animated Laser Scanning Line */}
              <div className="absolute left-0 right-0 h-0.5 bg-[#0df2c9] shadow-[0_0_12px_#0df2c9] opacity-80 scan-line" />

              <div className="flex flex-col items-center gap-2 z-10">
                <QrCode className="h-10 w-10 text-cyan-400/80" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0df2c9]">QR Secure Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* CHAT LOGS AND PREVIOUS HISTORY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AUDITED CHAT COMPARTMENT */}
          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                  Audited Chat Logs
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Escrowed messaging session (Read-Only)</p>
              </div>

              <button className="flex items-center gap-1.5 self-start rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all duration-300">
                <AlertTriangle className="h-4 w-4" />
                Raise Dispute Flag
              </button>
            </div>

            {/* CHAT THREAD CONNER */}
            <div className="space-y-4.5 bg-slate-950/20 rounded-2xl p-5 border border-slate-850 h-[320px] overflow-y-auto divide-y-0">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.mine ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`max-w-md rounded-2xl p-4 shadow-md ${message.mine
                        ? "bg-cyan-500/10 text-cyan-100 border border-cyan-500/25 rounded-tr-none"
                        : "bg-slate-900/80 text-slate-100 border border-slate-800 rounded-tl-none"
                      }`}
                  >
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider">{message.sender}</span>
                      <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {message.time}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-medium leading-relaxed">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RENTAL REGISTRY & CONTROLS */}
          <div className="space-y-6">
            {/* PREVIOUS RENTAL RECORD */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md shadow-lg shadow-slate-950/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <User className="h-4.5 w-4.5 text-slate-400" />
                Renter History Registry
              </h3>

              <div className="space-y-3">
                {rentalHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-850 bg-slate-950/40 p-3.5 hover:bg-slate-950/70 transition duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white">{item.item}</p>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.id}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.status === "Đang thuê"
                            ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                          }`}
                      >
                        {item.status}
                      </span>

                      <p className="text-[11px] font-bold text-slate-500">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AUDITOR DISPUTE PANEL */}
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-md shadow-lg shadow-rose-950/5">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertOctagon className="h-4.5 w-4.5" />
                Auditor Dispute Panel
              </h3>
              <p className="mt-2 text-xs font-medium text-slate-400 leading-relaxed">
                Take executive security actions to lock listings, restrict accounts, or close active rental escalations.
              </p>

              <div className="mt-5 space-y-3 font-semibold text-xs">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-500/10 border border-yellow-500/25 py-3 text-yellow-400 transition hover:bg-yellow-500/20">
                  <AlertTriangle className="h-4 w-4" />
                  Flag Listing For Review
                </button>

                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/25 py-3 text-rose-400 transition hover:bg-rose-500/20">
                  <UserX className="h-4 w-4" />
                  Suspend Renter Account
                </button>

                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500/10 border border-teal-500/25 py-3 text-teal-400 transition hover:bg-teal-500/20">
                  <CheckSquare className="h-4 w-4" />
                  Mark Dispute Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
