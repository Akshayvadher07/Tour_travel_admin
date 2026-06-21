function getBase(): string {
  let base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:3010";
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return base;
}

function adminKey(): string {
  return import.meta.env.VITE_ADMIN_API_KEY?.trim() || "";
}

export function getApiBase(): string {
  return getBase();
}

export function adminHeaders(): HeadersInit {
  const key = adminKey();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (key) headers["x-admin-key"] = key;
  return headers;
}

export function adminHeadersForRead(): HeadersInit {
  const key = adminKey();
  const headers: Record<string, string> = {};
  if (key) headers["x-admin-key"] = key;
  return headers;
}

export async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function errMsg(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const o = body as Record<string, unknown>;
  if (o.error && typeof o.error === "object") {
    const e = o.error as Record<string, unknown>;
    const code = typeof e.code === "string" ? e.code : "";
    const msg = typeof e.message === "string" ? e.message : fallback;
    return code ? `[${code}] ${msg}` : msg;
  }
  if (typeof o.message === "string") return o.message;
  return fallback;
}

export async function apiGet(path: string, headers?: HeadersInit) {
  const res = await fetch(`${getBase()}${path}`, { headers });
  const body = await parseBody(res);
  if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
  return body as Record<string, unknown>;
}

export async function apiJson<T>(path: string, method: "POST" | "PUT", payload: unknown): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    method,
    headers: adminHeaders(),
    body: JSON.stringify(payload),
  });
  const body = await parseBody(res);
  if (!res.ok) throw new Error(errMsg(body, `HTTP ${res.status}`));
  return body as T;
}

export async function apiUpload(path: string, formData: FormData): Promise<Record<string, unknown>> {
  const key = adminKey();
  const headers: Record<string, string> = {};
  if (key) headers["x-admin-key"] = key;
  const res = await fetch(`${getBase()}${path}`, { method: "POST", headers, body: formData });
  const body = await parseBody(res);
  if (!res.ok) throw new Error(errMsg(body, `Upload failed: HTTP ${res.status}`));
  return body as Record<string, unknown>;
}
