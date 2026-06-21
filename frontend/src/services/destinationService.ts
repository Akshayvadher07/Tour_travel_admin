import { adminHeadersForRead, apiGet, apiJson } from "./http";
import type { Destination } from "../types/destination";

export async function listDestinations(opts?: { includeDeleted?: boolean }): Promise<Destination[]> {
  const query = new URLSearchParams();
  if (opts?.includeDeleted) query.set("includeDeleted", "true");
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const data = await apiGet(
    `/api/destinations${suffix}`,
    opts?.includeDeleted ? adminHeadersForRead() : undefined
  );
  if (data.success !== true || !Array.isArray(data.data)) throw new Error("Invalid destinations response");
  return data.data as Destination[];
}

export async function fetchDestinationById(id: string): Promise<Destination | null> {
  const data = await apiGet(`/api/destinations/${id}?includeDeleted=true`, adminHeadersForRead());
  if (data.success !== true || !data.data || typeof data.data !== "object") return null;
  return data.data as Destination;
}

export type DestinationInput = {
  name: string;
  description: string;
  imageUrl: string;
};

export async function createDestination(payload: DestinationInput): Promise<Destination> {
  const data = await apiJson<Record<string, unknown>>("/api/destinations", "POST", payload);
  if (data.success !== true || !data.data || typeof data.data !== "object") throw new Error("Invalid create destination response");
  return data.data as Destination;
}

export async function updateDestination(id: string, patch: Partial<DestinationInput & { deleted: boolean }>): Promise<Destination> {
  const data = await apiJson<Record<string, unknown>>(`/api/destinations/${id}`, "PUT", patch);
  if (data.success !== true || !data.data || typeof data.data !== "object") throw new Error("Invalid update destination response");
  return data.data as Destination;
}
