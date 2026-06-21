import { useCallback, useEffect, useMemo, useState } from "react";
import { listTravelPlans } from "../services/travelPlanService";
import type { TravelPlan } from "../types/travelPlan";

function formatDate(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN");
}

export function TravelPlanListPage() {
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setPlans(await listTravelPlans());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load travel plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return plans;
    return plans.filter((p) => {
      const haystack = [
        p.fullName || "",
        p.email || "",
        p.phone || "",
        p.message || "",
        p.status || "",
        (p.destinations || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(s);
    });
  }, [plans, q]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Travel Plans</h1>
      {err ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, phone, destination..."
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
        />
        <span className="text-sm text-slate-500">{filtered.length} request(s)</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-slate-500">No travel plan requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Destinations</th>
                  <th className="px-4 py-3">Travel Date</th>
                  <th className="px-4 py-3">Guests</th>
                  <th className="px-4 py-3">Message</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requested At</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p._id}>
                    <td className="border-t border-slate-100 px-4 py-3 font-medium text-slate-800">{p.fullName || "-"}</td>
                    <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                      <div>{p.email || "-"}</div>
                      <div className="text-xs text-slate-500">{p.phone || "-"}</div>
                    </td>
                    <td className="border-t border-slate-100 px-4 py-3 text-slate-700">
                      {(p.destinations || []).length ? (p.destinations || []).join(", ") : "-"}
                    </td>
                    <td className="border-t border-slate-100 px-4 py-3 text-slate-600">{p.travelDate || "-"}</td>
                    <td className="border-t border-slate-100 px-4 py-3 text-slate-600">
                      A:{typeof p.adults === "number" ? p.adults : 0} / C:{typeof p.children === "number" ? p.children : 0}
                    </td>
                    <td className="max-w-xs border-t border-slate-100 px-4 py-3 text-slate-600">{p.message || "-"}</td>
                    <td className="border-t border-slate-100 px-4 py-3">
                      <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {p.status || "new"}
                      </span>
                    </td>
                    <td className="border-t border-slate-100 px-4 py-3 text-slate-500">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
