import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createTour, fetchTourById, updateTour } from "../services/tourService";
import { listDestinations } from "../services/destinationService";
import { uploadTourImage } from "../services/uploadService";
import type { TourCategory, TourInput } from "../types/tour";

const CATEGORIES: TourCategory[] = ["adventure", "cultural", "relaxation", "wildlife", "city"];

const empty: TourInput = {
  title: "",
  destination: "",
  description: "",
  durationDays: 7,
  priceFrom: 0,
  images: [],
  category: "cultural",
  featured: false,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageItem {
  /** Unique key for React reconciliation */
  key: string;
  /** Final uploaded URL (empty while uploading) */
  url: string;
  /** Local blob preview URL */
  preview: string;
  uploading: boolean;
  error: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeKey() {
  return Math.random().toString(36).slice(2);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TourFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<TourInput>(empty);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<string[]>([]);

  // Multi-image state
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form.images whenever imageItems change
  useEffect(() => {
    const urls = imageItems.filter((i) => i.url).map((i) => i.url);
    setForm((f) => ({ ...f, images: urls }));
  }, [imageItems]);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadTour = useCallback(async () => {
    if (!id) return;
    setErr(null);
    setLoading(true);
    try {
      const t = await fetchTourById(id);
      if (!t) {
        setErr("Tour not found.");
        setForm(empty);
        return;
      }
      setForm({
        title: t.title,
        destination: t.destination,
        description: t.description,
        durationDays: t.durationDays,
        priceFrom: t.priceFrom,
        images: t.images,
        category: t.category,
        featured: t.featured,
      });
      // Pre-populate image items from existing URLs
      setImageItems(
        t.images.map((url) => ({
          key: makeKey(),
          url,
          preview: url,
          uploading: false,
          error: null,
        }))
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load tour");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadDestinations = useCallback(async () => {
    try {
      const data = await listDestinations();
      setDestinations(data.map((d) => d.name));
    } catch (_e) {
      setDestinations([]);
    }
  }, []);

  useEffect(() => {
    if (isEdit) void loadTour();
    else {
      setForm({ ...empty });
      setImageItems([]);
      setLoading(false);
    }
    void loadDestinations();
  }, [isEdit, loadTour, loadDestinations]);

  // ── Image handlers ──────────────────────────────────────────────────────────

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    // Reset input so the same file can be re-selected after removal
    e.target.value = "";

    const newItems: ImageItem[] = files.map((file) => ({
      key: makeKey(),
      url: "",
      preview: URL.createObjectURL(file),
      uploading: true,
      error: null,
    }));

    setImageItems((prev) => [...prev, ...newItems]);

    // Upload each file independently
    await Promise.all(
      newItems.map(async (item, idx) => {
        const file = files[idx];
        try {
          const uploadedUrl = await uploadTourImage(file);
          URL.revokeObjectURL(item.preview);
          setImageItems((prev) =>
            prev.map((i) =>
              i.key === item.key ? { ...i, url: uploadedUrl, preview: uploadedUrl, uploading: false } : i
            )
          );
        } catch (e) {
          setImageItems((prev) =>
            prev.map((i) =>
              i.key === item.key
                ? { ...i, uploading: false, error: e instanceof Error ? e.message : "Upload failed" }
                : i
            )
          );
        }
      })
    );
  }

  function onRemoveImage(key: string) {
    setImageItems((prev) => {
      const item = prev.find((i) => i.key === key);
      if (item?.preview.startsWith("blob:")) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.key !== key);
    });
  }

  function onMoveImage(key: string, direction: "up" | "down") {
    setImageItems((prev) => {
      const idx = prev.findIndex((i) => i.key === key);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const readyImages = imageItems.filter((i) => i.url && !i.uploading && !i.error);
    if (readyImages.length === 0) {
      setErr("Please upload at least one image before saving.");
      return;
    }
    const stillUploading = imageItems.some((i) => i.uploading);
    if (stillUploading) {
      setErr("Please wait for all images to finish uploading.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const payload = { ...form, images: readyImages.map((i) => i.url) };
      if (isEdit && id) {
        await updateTour(id, payload);
      } else {
        await createTour(payload);
      }
      navigate("/tours");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const anyUploading = imageItems.some((i) => i.uploading);
  const pageTitle = isEdit ? "Edit tour" : "Add new tour";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-900">{pageTitle}</h2>
        <Link
          to="/tours"
          className="rounded-md px-2 py-1 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Back to list"
        >
          ×
        </Link>
      </div>

      {loading ? (
        <p className="px-6 py-8 text-slate-500">Loading…</p>
      ) : (
        <div className="px-6 py-6">
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            {err ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
            ) : null}

            {/* Title + Destination */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Title <span className="text-red-500">*</span>
                <input
                  required
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Destination <span className="text-red-500">*</span>
                <select
                  required
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
                  value={form.destination}
                  onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                >
                  <option value="">Select destination</option>
                  {destinations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Description */}
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-300">
              <textarea
                required
                rows={8}
                className="block min-h-40 w-full resize-y border-none px-3 py-2 outline-none"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* ── Multi-Image Upload ── */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Images <span className="text-red-500">*</span>
                  <span className="ml-1 text-xs font-normal text-slate-400">(first image is the cover)</span>
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={anyUploading}
                  className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
                >
                  + Add images
                </button>
              </div>

              {/* Hidden file input — multiple */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                style={{ display: "none" }}
                disabled={anyUploading}
                onChange={(e) => void onFilesSelected(e)}
              />

              {/* Empty state drop zone */}
              {imageItems.length === 0 && (
                <div
                  className="cursor-pointer rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition hover:border-blue-400 hover:bg-blue-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="mb-2 text-3xl">🖼️</div>
                  <p className="m-0 text-sm text-slate-500">
                    Click to select images (JPEG, PNG, WebP, GIF · max 5 MB each)
                  </p>
                </div>
              )}

              {/* Image grid */}
              {imageItems.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {imageItems.map((item, idx) => (
                    <div
                      key={item.key}
                      className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                    >
                      {/* Image / spinner */}
                      {item.uploading ? (
                        <div className="flex aspect-square items-center justify-center">
                          <span className="text-xs text-slate-500">Uploading…</span>
                        </div>
                      ) : item.error ? (
                        <div className="flex aspect-square flex-col items-center justify-center gap-1 p-2 text-center">
                          <span className="text-lg">⚠️</span>
                          <span className="text-xs text-red-600">{item.error}</span>
                          <button
                            type="button"
                            onClick={() => onRemoveImage(item.key)}
                            className="mt-1 text-xs text-red-500 underline"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <img
                            src={item.preview}
                            alt={`Tour image ${idx + 1}`}
                            className="aspect-square w-full object-cover"
                          />

                          {/* Cover badge */}
                          {idx === 0 && (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                              Cover
                            </span>
                          )}

                          {/* Overlay controls */}
                          <div className="absolute inset-0 flex flex-col items-end justify-between p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => onRemoveImage(item.key)}
                              title="Remove image"
                              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                            >
                              ×
                            </button>

                            {/* Reorder */}
                            <div className="flex gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => onMoveImage(item.key, "up")}
                                title="Move left"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white disabled:opacity-30"
                              >
                                ←
                              </button>
                              <button
                                type="button"
                                disabled={idx === imageItems.length - 1}
                                onClick={() => onMoveImage(item.key, "down")}
                                title="Move right"
                                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white disabled:opacity-30"
                              >
                                →
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Add-more tile */}
                  <div
                    className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-blue-400 hover:bg-blue-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="text-2xl text-slate-400">+</span>
                  </div>
                </div>
              )}
            </div>

            {/* Duration + Price */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Duration (days) <span className="text-red-500">*</span>
                <input
                  required
                  type="number"
                  min={1}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
                  value={form.durationDays}
                  onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Price from <span className="text-red-500">*</span>
                <input
                  required
                  type="number"
                  min={0}
                  step={1}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
                  value={form.priceFrom}
                  onChange={(e) => setForm((f) => ({ ...f, priceFrom: Number(e.target.value) }))}
                />
              </label>
            </div>

            {/* Category + visibility */}
            <div className="rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm">
                <span className="font-semibold text-slate-900">Tour options</span>
                <span className="text-slate-500">Category & visibility</span>
              </div>
              <div className="space-y-4 px-4 py-4">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Category</div>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {CATEGORIES.map((c) => (
                      <label key={c} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="radio"
                          name="category"
                          value={c}
                          checked={form.category === c}
                          onChange={() => setForm((f) => ({ ...f, category: c }))}
                        />
                        <span>{c}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Visibility</div>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                    />
                    <span>Featured on homepage</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
              <Link to="/tours" className="px-3 py-2 text-sm font-medium text-blue-600 hover:underline">
                Cancel
              </Link>
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving || anyUploading}
              >
                {saving ? "Saving…" : anyUploading ? "Uploading…" : isEdit ? "Save changes" : "Create tour"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}