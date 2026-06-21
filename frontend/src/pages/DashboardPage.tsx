import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listTours } from "../services/tourService";
import type { Tour } from "../types/tour";
import { IconList } from "../components/Icons";

export function DashboardPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      setTours(await listTours());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const total = tours.length;
    const featured = tours.filter((t) => t.featured).length;

    // Category logic...
    const categories = new Map<string, number>();
    for (const t of tours) {
      categories.set(t.category, (categories.get(t.category) ?? 0) + 1);
    }
    const topCategory = [...categories.entries()].sort((a, b) => b[1] - a[1])[0];

    // Robust Average Price Calculation
    const totalSum = tours.reduce((acc, t) => acc + (t.priceFrom || 0), 0);
    const avgPrice = total > 0 ? Math.round(totalSum / total) : 0;

    return {
      total,
      featured,
      topCategory: topCategory?.[0] ?? "—",
      topCategoryCount: topCategory?.[1] ?? 0,
      avgPrice
    };
  }, [tours]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-5 text-white shadow-lg">
              <div className="text-sm opacity-90">Total tours</div>
              <div className="mt-2 text-4xl font-bold">{stats.total}</div>
              <div className="mt-1 text-xs opacity-80">Published in catalogue</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
              <div className="text-sm opacity-90">Featured tours</div>
              <div className="mt-2 text-4xl font-bold">{stats.featured}</div>
              <div className="mt-1 text-xs opacity-80">Shown on homepage highlights</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-5 text-white shadow-lg">
              <div className="text-sm opacity-90">Top category</div>
              <div className="mt-2 text-2xl font-bold capitalize">{stats.topCategory}</div>
              <div className="mt-1 text-xs opacity-80">{stats.topCategoryCount} tour(s) in this category</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 p-5 text-white shadow-lg">
              <div className="text-sm opacity-90">Avg. price from</div>
              <div className="mt-2 text-3xl font-bold">
                ₹{stats.avgPrice.toLocaleString("en-IN")}
              </div>
              <div className="mt-1 text-xs opacity-80">Across {stats.total} tour listings</div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Catalogue snapshot</h2>
              <p className="mt-2 text-sm text-slate-600">
                Featured {stats.featured} of {stats.total} tours. Add or edit listings under Content.
              </p>
            </div>
            <Link to="/tours" className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-md">
              <IconList className="rounded-lg bg-blue-50 p-2 text-blue-600" size={40} />
              <div>
                <div className="font-semibold text-slate-900">All tours</div>
                <div className="text-sm text-slate-500">Open list & search</div>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
