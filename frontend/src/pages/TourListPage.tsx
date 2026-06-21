import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listTours, updateTour } from "../services/tourService";
import type { Tour } from "../types/tour";
import { 
  IconPencil, 
  IconPlus, 
  IconSearch, 
  IconTrash, 
  IconUndo 
} from "../components/Icons";

export function TourListPage() {
  const navigate = useNavigate();
  
  // -- State --
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  
  // -- Modal State --
  const [deletingTour, setDeletingTour] = useState<Tour | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // -- Data Loading --
  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      // Fetching all tours including soft-deleted ones for the admin view
      const data = await listTours({ includeDeleted: true });
      setTours(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load tours");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // -- Derived Data (Search & Stats) --
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tours;
    return tours.filter(
      (t) =>
        t.title.toLowerCase().includes(s) ||
        t.destination.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s) ||
        t.category.toLowerCase().includes(s)
    );
  }, [tours, q]);

  const activeCount = useMemo(() => tours.filter((t) => !t.deleted).length, [tours]);
  const deletedCount = useMemo(() => tours.filter((t) => t.deleted).length, [tours]);

  // -- Action Handlers --
  async function confirmDelete() {
    if (!deletingTour) return;
    
    setIsDeleting(true);
    setErr(null);
    try {
      const updated = await updateTour(deletingTour._id, { deleted: true });
      setTours((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
      setDeletingTour(null); // Close modal on success
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed");
    } finally {
      setIsDeleting(false);
    }
  }

  async function onRestore(t: Tour) {
    setErr(null);
    try {
      const updated = await updateTour(t._id, { deleted: false });
      setTours((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Restore failed");
    }
  }

  function truncate(text: string, max: number) {
    if (text.length <= max) return text;
    return text.slice(0, max - 1) + "…";
  }

  return (
    <div className="relative space-y-4 pb-20">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tours</h1>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-1">
          {err}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-full max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
          <IconSearch className="text-slate-400" size={18} />
          <input
            type="search"
            className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search by name, destination, category..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Link 
          to="/tours/new" 
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <IconPlus size={18} />
          Add tour
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
        <span className="h-6 w-1 rounded-full bg-blue-600" />
        <span>
          {q.trim() ? (
            <><strong>{filtered.length}</strong> matches found</>
          ) : (
            <>
              <strong>{tours.length}</strong> in catalogue 
              <span className="text-slate-500"> ({activeCount} active, {deletedCount} deleted)</span>
            </>
          )}
        </span>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-10 text-center text-slate-500">Loading catalog...</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-slate-500">No tours found matching your criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 font-bold">
                  <th className="w-20 px-4 py-4">Image</th>
                  <th className="px-4 py-4">Name & Category</th>
                  <th className="px-4 py-4">Description</th>
                  <th className="px-4 py-4">Destination</th>
                  <th className="px-4 py-4">Price</th>
                  <th className="w-28 px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr 
                    key={t._id} 
                    className={`transition-colors hover:bg-slate-50/50 ${t.deleted ? "opacity-60 bg-slate-50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <img 
                        className="h-11 w-11 rounded-lg border border-slate-200 object-cover bg-slate-100" 
                        src={t.imageUrl} 
                        alt="" 
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{t.title}</div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                        {t.category}
                        {t.deleted && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-700">
                            Deleted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-500 leading-snug">
                      {truncate(t.description, 100)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.destination}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      ₹{t.priceFrom.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => navigate(`/tours/${t._id}/edit`)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                          title="Edit"
                        >
                          <IconPencil size={18} />
                        </button>
                        
                        {t.deleted ? (
                          <button
                            onClick={() => void onRestore(t)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-emerald-500 transition hover:bg-emerald-50"
                            title="Restore"
                          >
                            <IconUndo size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeletingTour(t)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <IconTrash size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deletingTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => !isDeleting && setDeletingTour(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md transform rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <IconTrash size={24} />
            </div>
            
            <div className="mt-4">
              <h3 className="text-xl font-bold text-slate-900">Delete Tour?</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Are you sure you want to delete <span className="font-bold text-slate-800">“{deletingTour.title}”</span>? 
                This action will hide the tour from your public travel portal, but you can restore it later if needed.
              </p>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingTour(null)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 active:scale-95 disabled:bg-red-400"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}