import { apiUpload } from "./http";

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const data = await apiUpload("/api/upload/image", formData);
  if (data.success !== true || typeof (data.data as { url?: string })?.url !== "string") {
    throw new Error("Invalid upload response");
  }
  return (data.data as { url: string }).url;
}

export async function uploadTourImage(file: File): Promise<string> {
  return uploadImage(file);
}
