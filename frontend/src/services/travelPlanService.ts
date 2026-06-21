import { apiGet } from "./http";
import type { TravelPlan } from "../types/travelPlan";

export async function listTravelPlans(): Promise<TravelPlan[]> {
  const data = await apiGet("/api/travel-plans?limit=200");
  if (data.success !== true || !Array.isArray(data.data)) throw new Error("Invalid travel plans response");
  return data.data as TravelPlan[];
}
