import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createDestination,
  fetchDestinationById,
  updateDestination,
  type DestinationInput,
} from "../services/destinationService";
import { uploadImage } from "../services/uploadService";

const emptyForm: DestinationInput = {
  name: "",
  description: "",
  imageUrl: "",
};

export function DestinationFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState<DestinationInput>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const loadDestination = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErr(null);
    try {
      const destination = await fetchDestinationById(id);
      if (!destination) {
        setErr("Destination not found.");
        return;
      }
      setForm({
        name: destination.name,
        description: destination.description,
        imageUrl: destination.imageUrl,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load destination");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      void loadDestination();
      return;
    }
    setLoading(false);
    setForm(emptyForm);
  }, [isEdit, loadDestination]);

  async function onImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr(null);
    try {
      const imageUrl = await uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl }));
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.imageUrl.trim()) {
      setErr("Name, description and image are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const payload: DestinationInput = {
        name: form.name.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
      };
      if (isEdit && id) {
        await updateDestination(id, payload);
      } else {
        await createDestination(payload);
      }
      navigate("/destinations");
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Failed to save destination");
    } finally {
      setSaving(false);
    }
  }

  const pageTitle = isEdit ? "Edit destination" : "Add destination";

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <h2 className="text-xl font-semibold text-slate-900">{pageTitle}</h2>
        <Link
          to="/destinations"
          className="rounded-md px-2 py-1 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Back to destinations"
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
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            ) : null}

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Description <span className="text-red-500">*</span>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
              />
            </label>

            <div className="space-y-2">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Image <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => void onImageChange(e)}
                className="max-w-full text-sm"
              />
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt="Destination preview"
                  className="h-24 w-24 rounded-md border border-slate-200 object-cover"
                />
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
              <Link to="/destinations" className="px-3 py-2 text-sm font-medium text-blue-600 hover:underline">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || uploading}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : uploading ? "Uploading..." : isEdit ? "Save changes" : "Create destination"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
