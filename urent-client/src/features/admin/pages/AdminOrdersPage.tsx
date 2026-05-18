import { useNavigate } from "react-router-dom";

import { AdminLayout } from "../layout/AdminLayout";

interface OrderItem {
  id: string;
  renterName: string;
  trustScore: number;
  status: "Đang xử lý" | "Đang thuê" | "Đã trả";
  createdAt: string;
}

export function AdminOrdersPage() {
  const navigate = useNavigate();

  const orders: OrderItem[] = [
    {
      id: "MXTU-55",
      renterName: "Nguyễn Trọng Tiến",
      trustScore: 100,
      status: "Đang thuê",
      createdAt: "5/17/2026",
    },
    {
      id: "MXTU-56",
      renterName: "lahongquan",
      trustScore: 60,
      status: "Đang xử lý",
      createdAt: "5/16/2026",
    },
    {
      id: "MXTU-57",
      renterName: "Jane_Doe",
      trustScore: 10,
      status: "Đã trả",
      createdAt: "5/15/2026",
    },
    {
      id: "MXTU-58",
      renterName: "Tuan Anh",
      trustScore: 40,
      status: "Đang thuê",
      createdAt: "5/14/2026",
    },
    {
      id: "MXTU-59",
      renterName: "Office of Urent",
      trustScore: 100,
      status: "Đã trả",
      createdAt: "5/13/2026",
    },
  ];

  const getTrustColor = (trust: number) => {
    if (trust === 100) {
      return "bg-teal-500/10 text-teal-400";
    }

    if (trust === 60) {
      return "bg-yellow-500/10 text-yellow-400";
    }

    if (trust === 40) {
      return "bg-orange-500/10 text-orange-400";
    }

    return "bg-red-500/10 text-red-400";
  };

  const getStatusColor = (status: string) => {
    if (status === "Đang thuê") {
      return "bg-teal-500/10 text-teal-400";
    }

    if (status === "Đang xử lý") {
      return "bg-yellow-500/10 text-yellow-400";
    }

    return "bg-slate-500/20 text-slate-300";
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-5xl font-bold text-white">Orders Management</h1>

            <p className="mt-3 text-lg text-slate-400">
              Manage all rental orders & disputes
            </p>
          </div>

          <input
            placeholder="Search order..."
            className="rounded-2xl border border-slate-700 bg-slate-800/70 px-5 py-4 text-white outline-none placeholder:text-slate-500"
          />
        </div>
        <div className="grid grid-cols-3 gap-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7">
            <p className="text-slate-400">Total Orders</p>

            <h2 className="mt-4 text-6xl font-bold text-white">
              {orders.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7">
            <p className="text-slate-400">Renting</p>

            <h2 className="mt-4 text-6xl font-bold text-teal-400">
              {orders.filter((o) => o.status === "Đang thuê").length}
            </h2>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-7">
            <p className="text-slate-400">Processing</p>

            <h2 className="mt-4 text-6xl font-bold text-yellow-400">
              {orders.filter((o) => o.status === "Đang xử lý").length}
            </h2>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
          <div className="grid grid-cols-5 border-b border-slate-800 bg-slate-800/40 px-8 py-5 text-sm uppercase tracking-wider text-slate-400">
            <p>Tên người cho thuê</p>

            <p>Độ tín nhiệm</p>

            <p>Chat</p>

            <p>Status</p>

            <p>Đơn ngày</p>
          </div>
          <div>
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/admin/orders/${order.id}`)}
                className="grid cursor-pointer grid-cols-5 items-center border-b border-slate-800 px-8 py-6 transition-all duration-200 hover:bg-slate-800/30"
              >
                <div>
                  <p className="text-xl font-semibold text-white">
                    {order.renterName}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">#{order.id}</p>
                </div>
                <div>
                  <span
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${getTrustColor(
                      order.trustScore,
                    )}`}
                  >
                    {order.trustScore}%
                  </span>
                </div>
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();

                      navigate(`/admin/orders/${order.id}`);
                    }}
                    className="rounded-xl bg-cyan-500/10 px-5 py-2 text-sm font-medium text-cyan-400 transition hover:bg-cyan-500/20"
                  >
                    Open Chat
                  </button>
                </div>
                <div>
                  <span
                    className={`rounded-xl px-4 py-2 text-sm font-medium ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="text-slate-300">{order.createdAt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
