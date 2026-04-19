export async function uploadDataUrl(dataUrl: string, subdir: string): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, subdir }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Falha no upload");
  return json.url as string;
}
