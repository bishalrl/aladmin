export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json.data as T;
}

export async function apiSend<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Request failed");
  return json.data as T;
}
