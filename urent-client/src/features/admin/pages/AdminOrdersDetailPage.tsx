import { useNavigate, useParams } from "react-router-dom";

import { AdminLayout } from "../layout/AdminLayout";

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
      <div className="space-y-7">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/admin/orders")}
              className="mb-4 rounded-xl bg-slate-800 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-700"
            >
              ← Back
            </button>

            <h1 className="text-5xl font-bold text-white">Order Detail</h1>

            <p className="mt-3 text-lg text-slate-400">
              Manage rental order & dispute handling
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-6 py-4">
            <p className="text-sm text-slate-400">Order ID</p>

            <h2 className="mt-1 text-2xl font-bold text-cyan-400">#{id}</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">Người thuê</p>

            <h2 className="mt-4 text-3xl font-bold text-white">
              Nguyễn Trọng Tiến
            </h2>

            <p className="mt-2 text-slate-500">tienarena2k@gmail.com</p>

            <div className="mt-5 inline-flex rounded-xl bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-400">
              100% Trust
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">Rental Status</p>

            <div className="mt-5 inline-flex rounded-2xl bg-yellow-500/10 px-5 py-3 text-lg font-semibold text-yellow-400">
              Đang thuê
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex justify-between text-slate-400">
                <span>Ngày thuê</span>

                <span className="text-white">5/17/2026</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Ngày trả</span>

                <span className="text-white">5/24/2026</span>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-slate-400">QR Status</p>

            <div className="mt-5 flex h-44 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950">
              <div className="text-center">
                <div className="mx-auto h-20 w-20 rounded-xl bg-cyan-500/10" />

                <p className="mt-4 text-cyan-400">QR Active</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Chat History</h2>

                <p className="mt-1 text-slate-400">
                  Conversation between renter & owner
                </p>
              </div>

              <button className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20">
                Open Dispute
              </button>
            </div>

            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.mine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-md rounded-2xl px-5 py-4 ${
                      message.mine
                        ? "bg-cyan-500/10 text-cyan-100"
                        : "bg-slate-800 text-white"
                    }`}
                  >
                    <p className="text-sm font-semibold">{message.sender}</p>

                    <p className="mt-2">{message.text}</p>

                    <p className="mt-3 text-right text-xs text-slate-400">
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-2xl font-bold text-white">Rental History</h2>

            <p className="mt-1 text-slate-400">Previous renter activities</p>

            <div className="mt-6 space-y-4">
              {rentalHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{item.item}</p>

                    <span className="text-xs text-slate-500">{item.id}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`rounded-lg px-3 py-1 text-xs ${
                        item.status === "Đang thuê"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : "bg-teal-500/10 text-teal-400"
                      }`}
                    >
                      {item.status}
                    </span>

                    <p className="text-sm text-slate-400">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
              <h3 className="text-lg font-semibold text-red-400">
                Dispute Control
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Handle rental conflicts and suspicious activity.
              </p>

              <div className="mt-5 space-y-3">
                <button className="w-full rounded-xl bg-yellow-500/10 px-4 py-3 font-medium text-yellow-400 transition hover:bg-yellow-500/20">
                  Flag For Review
                </button>

                <button className="w-full rounded-xl bg-red-500/10 px-4 py-3 font-medium text-red-400 transition hover:bg-red-500/20">
                  Suspend Rental
                </button>

                <button className="w-full rounded-xl bg-teal-500/10 px-4 py-3 font-medium text-teal-400 transition hover:bg-teal-500/20">
                  Mark As Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
