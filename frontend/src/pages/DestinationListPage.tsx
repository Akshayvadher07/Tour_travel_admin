import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listDestinations, updateDestination } from "../services/destinationService";
import type { Destination } from "../types/destination";
import { IconPencil, IconTrash, IconUndo } from "../components/Icons";

export function DestinationListPage() {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ item: Destination; action: "delete" | "restore" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      setDestinations(await listDestinations({ includeDeleted: true }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openConfirmModal(item: Destination) {
    setConfirmModal({ item, action: item.deleted ? "restore" : "delete" });
  }

  function closeConfirmModal() {
    setConfirmModal(null);
  }

  async function handleConfirm() {
    if (!confirmModal) return;
    const { item } = confirmModal;
    try {
      const updated = await updateDestination(item._id, { deleted: !item.deleted });
      setDestinations((prev) => prev.map((d) => (d._id === updated._id ? updated : d)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update destination");
    } finally {
      closeConfirmModal();
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return destinations;
    return destinations.filter(
      (d) =>
        d.name.toLowerCase().includes(s) ||
        d.description.toLowerCase().includes(s)
    );
  }, [destinations, q]);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Destinations</h1>
      {err ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search destination"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-blue-500 transition focus:ring-2"
        />
        <Link
          to="/destinations/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Add destination
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d._id} className={d.deleted ? "opacity-60" : undefined}>
                  <td className="border-t border-slate-100 px-4 py-3">
                    <img src={d.imageUrl} alt={d.name} className="h-12 w-12 rounded-md border border-slate-200 object-cover" />
                  </td>
                  <td className="border-t border-slate-100 px-4 py-3 font-medium text-slate-800">{d.name}</td>
                  <td className="border-t border-slate-100 px-4 py-3 text-slate-600">{d.description}</td>
                  <td className="border-t border-slate-100 px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                        aria-label={`Edit ${d.name}`}
                        onClick={() => navigate(`/destinations/${d._id}/edit`)}
                      >
                        <IconPencil />
                      </button>
                      {d.deleted ? (
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                          title="Restore"
                          aria-label={`Restore ${d.name}`}
                          onClick={() => openConfirmModal(d)}
                        >
                          <IconUndo />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                          title="Mark deleted"
                          aria-label={`Mark deleted ${d.name}`}
                          onClick={() => openConfirmModal(d)}
                        >
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              {confirmModal.action === "delete" ? "Mark as Deleted" : "Restore Destination"}
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {confirmModal.action === "delete"
                ? `Are you sure you want to mark "${confirmModal.item.name}" as deleted?`
                : `Are you sure you want to restore "${confirmModal.item.name}"?`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                  confirmModal.action === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {confirmModal.action === "delete" ? "Delete" : "Restore"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
