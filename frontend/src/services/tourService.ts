import { adminHeadersForRead, apiGet, apiJson } from "./http";
import type { Tour, TourInput, TourUpdate } from "../types/tour";

export async function fetchTourById(id: string): Promise<Tour | null> {
  const data = await apiGet(`/api/tours/${id}?includeDeleted=true`, adminHeadersForRead());
  if (data.success !== true || !data.data || typeof data.data !== "object") return null;
  return normaliseTour(data.data as Record<string, unknown>);
}

export async function listTours(opts?: { includeDeleted?: boolean }): Promise<Tour[]> {
  const query = new URLSearchParams({ limit: "100" });
  if (opts?.includeDeleted) query.set("includeDeleted", "true");
  const data = await apiGet(
    `/api/tours?${query.toString()}`,
    opts?.includeDeleted ? adminHeadersForRead() : undefined
  );
  if (data.success !== true || !Array.isArray(data.data)) throw new Error("Invalid tours response");
  return (data.data as Record<string, unknown>[]).map(normaliseTour);
}

export async function createTour(payload: TourInput): Promise<Tour> {
  const data = await apiJson<Record<string, unknown>>("/api/tours", "POST", payload);
  if (data.success !== true || !data.data || typeof data.data !== "object") throw new Error("Invalid create response");
  return normaliseTour(data.data as Record<string, unknown>);
}

export async function updateTour(id: string, patch: TourUpdate): Promise<Tour> {
  const data = await apiJson<Record<string, unknown>>(`/api/tours/${id}`, "PUT", patch);
  if (data.success !== true || !data.data || typeof data.data !== "object") throw new Error("Invalid update response");
  return normaliseTour(data.data as Record<string, unknown>);
}

/**
 * Normalise API responses so `images` is always a string[].
 * Handles both new format (`images: [...]`) and legacy (`imageUrl: "..."`).
 */
function normaliseTour(raw: Record<string, unknown>): Tour {
  const tour = raw as Tour;

  if (!Array.isArray(tour.images) || tour.images.length === 0) {
    // Backward compat: server returned old imageUrl field
    const legacy = typeof tour.imageUrl === "string" && tour.imageUrl ? tour.imageUrl : "";
    tour.images = legacy ? [legacy] : [];
  }

  return tour;
}