import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Header } from "@/components/header";
import {
  BadgeCheck,
  CalendarClock,
  Globe2,
  Route as RouteIcon,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000";

type RouteHistoryItem = {
  id?: string;
  route_id?: string;
  start_name?: string;
  start_address?: string;
  end_name?: string;
  end_address?: string;
  distance?: number;
  duration_min?: number;
  created_at?: string;
};

export default function Profile() {
  const [user, setUser] = useState({ username: "", email: "" });
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>([]);

  useEffect(() => {
    // Load user info from localStorage or backend
    const storedUser = window.localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          username: parsed.username || "",
          email: parsed.email || "",
        });
      } catch {
        // Ignore JSON parse errors, fallback to default user state
      }
    }
    // Fetch route history from backend
    const token = window.localStorage.getItem("access_token");
    if (token) {
      fetch(`${API_BASE_URL}/routes/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setRouteHistory(data?.data ?? []))
        .catch(() => setRouteHistory([]));
    }
  }, []);

  const stats = useMemo(() => {
    const totalDistanceMeters = routeHistory.reduce(
      (sum, entry) => sum + (entry.distance ?? 0),
      0
    );
    const totalDurationMinutes = routeHistory.reduce(
      (sum, entry) => sum + (entry.duration_min ?? 0),
      0
    );
    const latestTrip = routeHistory[0]?.created_at;
    const averageDuration =
      routeHistory.length > 0 ? totalDurationMinutes / routeHistory.length : 0;

    return [
      {
        label: "Trips logged",
        value: routeHistory.length > 0 ? routeHistory.length : "No trips yet",
        icon: RouteIcon,
      },
      {
        label: "Total distance",
        value:
          totalDistanceMeters > 0
            ? `${(totalDistanceMeters / 1000).toFixed(1)} km`
            : "0 km",
        icon: Globe2,
      },
      {
        label: "Avg duration",
        value:
          averageDuration > 0
            ? `${Math.round(averageDuration)} min`
            : "Not available",
        icon: CalendarClock,
      },
      {
        label: "Latest trip",
        value: latestTrip
          ? new Date(latestTrip).toLocaleDateString()
          : "Awaiting your journey",
        icon: BadgeCheck,
      },
    ];
  }, [routeHistory]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const token = window.localStorage.getItem("access_token");
    try {
      const res = await fetch(`${API_BASE_URL}/user/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ ...user, password }),
      });
      const data = await res.json();
      if (!res.ok || !data?.is_success) {
        toast.error(data?.msg || "Update failed");
      } else {
        toast.success("Account updated successfully");
        window.localStorage.setItem("user", JSON.stringify({ ...user }));
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/85 to-slate-950" />
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.32),transparent_60%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      </div>

      <Header />

      <main className="relative z-10 flex-1">
        <div className="container mx-auto px-4 pb-16 pt-12 lg:px-8">
          <section className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-300/80">
                <ShieldCheck className="size-4 text-emerald-400" />
                Trusted explorer profile
              </span>
              <div>
                <h1 className="text-4xl font-bold text-white sm:text-5xl">
                  Your Journey Dashboard
                </h1>
                <p className="mt-4 text-base text-slate-300 sm:text-lg">
                  Update your account details and revisit the routes you&apos;ve
                  discovered across Myanmar. Keep exploring—the Golden Land has
                  many stories left to tell.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:border-emerald-400/40 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-slate-300/80">
                        {label}
                      </span>
                      <Icon className="size-4 text-emerald-300 transition group-hover:text-emerald-200" />
                    </div>
                    <p className="mt-3 text-lg font-semibold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-emerald-500/30 blur-3xl opacity-40" />
              <div className="relative flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur-lg">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/80 to-cyan-500/70 text-slate-950 shadow-lg">
                  <UserRound className="size-7" />
                </div>
                <div>
                  <p className="text-sm text-slate-300/90">Signed in as</p>
                  <p className="text-lg font-semibold text-white">
                    {user.username || "Explorer"}
                  </p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-14 grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/80 to-violet-500/70 text-white shadow-lg">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white sm:text-2xl">
                    Account preferences
                  </h2>
                  <p className="text-sm text-slate-400">
                    Refresh your details to keep your travel companion in sync.
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="mt-8 grid gap-6">
                <label className="space-y-2 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <UserRound className="size-4 text-emerald-300" />
                    Explorer name
                  </span>
                  <input
                    type="text"
                    value={user.username}
                    onChange={(e) =>
                      setUser((u) => ({ ...u, username: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-base text-white shadow-inner focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <Globe2 className="size-4 text-emerald-300" />
                    Contact email
                  </span>
                  <input
                    type="email"
                    value={user.email}
                    onChange={(e) =>
                      setUser((u) => ({ ...u, email: e.target.value }))
                    }
                    className="w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-base text-white shadow-inner focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                    required
                  />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="inline-flex items-center gap-2 text-slate-300">
                    <ShieldCheck className="size-4 text-emerald-300" />
                    New password
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-slate-950/40 px-4 py-3 text-base text-white shadow-inner placeholder:text-slate-500 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                    placeholder="Leave blank to keep current"
                  />
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 px-4 py-3 text-base font-semibold text-slate-950 shadow-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60",
                    loading && "animate-pulse"
                  )}
                >
                  {loading ? "Saving changes…" : "Save profile"}
                </button>
              </form>
            </div>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-xl sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white sm:text-2xl">
                    Route history
                  </h2>
                  <p className="text-sm text-slate-400">
                    Every expedition you plan is stored here with distance and
                    timestamps.
                  </p>
                </div>
              </div>

              {routeHistory.length === 0 ? (
                <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-950/30 px-6 py-12 text-center text-slate-400">
                  <RouteIcon className="mb-4 size-10 text-emerald-300/70" />
                  <h3 className="text-lg font-semibold text-white">
                    No journeys catalogued yet
                  </h3>
                  <p className="mt-2 max-w-sm text-sm text-slate-400">
                    Plan your first route to see it appear here with all the key
                    details at a glance.
                  </p>
                </div>
              ) : (
                <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/30">
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-sm text-slate-200">
                      <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300/80">
                        <tr>
                          <th className="px-4 py-3">From</th>
                          <th className="px-4 py-3">To</th>
                          <th className="px-4 py-3">Distance</th>
                          <th className="px-4 py-3">Duration</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {routeHistory.map((route, idx) => {
                          const key = route.id ?? route.route_id ?? `${idx}`;
                          return (
                            <tr
                              key={key}
                              className="transition hover:bg-white/5"
                            >
                              <td className="px-4 py-3 text-sm text-slate-200">
                                {route.start_name || route.start_address || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-200">
                                {route.end_name || route.end_address || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-200">
                                {route.distance
                                  ? `${(route.distance / 1000).toFixed(2)} km`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-200">
                                {route.duration_min
                                  ? `${Math.round(route.duration_min)} min`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-200">
                                {route.created_at
                                  ? new Date(route.created_at).toLocaleString()
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}
