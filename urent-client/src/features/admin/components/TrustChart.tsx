interface Props {
  users: {
    trustScore?: number;
  }[];
}

export function TrustChart({ users }: Props) {
  const trust100 = users.filter(
    (user) => (user.trustScore || 100) === 100,
  ).length;

  const trust60 = users.filter((user) => user.trustScore === 60).length;

  const trust40 = users.filter((user) => user.trustScore === 40).length;

  const trust10 = users.filter((user) => user.trustScore === 10).length;

  const total = trust100 + trust60 + trust40 + trust10;

  const green = total > 0 ? (trust100 / total) * 100 : 0;

  const yellow = total > 0 ? (trust60 / total) * 100 : 0;

  const orange = total > 0 ? (trust40 / total) * 100 : 0;

  return (
    <div>
      <p className="mb-6 text-sm text-slate-400">Độ tín nhiệm</p>

      <div className="flex justify-center">
        <div
          className="relative h-48 w-48 rounded-full"
          style={{
            background: `conic-gradient(
              #14b8a6 0% ${green}%,
              #facc15 ${green}% ${green + yellow}%,
              #fb923c ${green + yellow}% ${green + yellow + orange}%,
              #ef4444 ${green + yellow + orange}% 100%
            )`,
          }}
        >
          <div className="absolute inset-7 rounded-full bg-slate-900" />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-teal-400" />

          <span className="text-white">100% ({trust100})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-yellow-400" />

          <span className="text-white">60% ({trust60})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-orange-400" />

          <span className="text-white">40% ({trust40})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-400" />

          <span className="text-white">10% ({trust10})</span>
        </div>
      </div>
    </div>
  );
}
