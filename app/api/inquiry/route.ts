import { NextResponse } from "next/server";

const allowedExtensions = new Set(["pdf","step","stp","dxf","doc","docx","xls","xlsx","ppt","pptx","jpg","jpeg","png","webp"]);
const allowedMimeTypes = new Set([
  "application/pdf","application/step","application/vnd.ms-pki.stl","application/octet-stream",
  "application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg","image/png","image/webp","image/vnd.dxf","application/dxf",
]);
const maxFiles = 5;
const defaultMaxBytes = 15 * 1024 * 1024;

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, maxLength) : "";
}

function safeFilename(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  const stem = filename.replace(/\.[^.]+$/, "").normalize("NFKD").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "document";
  return `${Date.now()}-${crypto.randomUUID()}-${stem}.${extension}`;
}

function failure(code: string, status = 400) {
  return NextResponse.json({ ok: false, code }, { status });
}

export async function POST(request: Request) {
  let incoming: FormData;
  try { incoming = await request.formData(); }
  catch { return failure("INVALID_FORM_DATA"); }

  // Honeypot responses are deliberately indistinguishable from successful submissions.
  if (cleanText(incoming.get("companyWebsite"), 200)) return NextResponse.json({ ok: true });

  const startedAt = Number(cleanText(incoming.get("formStartedAt"), 32));
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1500 || Date.now() - startedAt > 24 * 60 * 60 * 1000) return failure("SPAM_CHECK_FAILED", 429);

  const fields = {
    name: cleanText(incoming.get("name"), 120),
    company: cleanText(incoming.get("company"), 160),
    email: cleanText(incoming.get("email"), 254).toLowerCase(),
    subject: cleanText(incoming.get("subject"), 180),
    description: cleanText(incoming.get("description"), 8000),
    documentLink: cleanText(incoming.get("documentLink"), 2000),
    language: cleanText(incoming.get("language"), 2),
  };
  if (!fields.name || !fields.company || !fields.email || !fields.subject || !fields.description || incoming.get("privacy") !== "on") return failure("VALIDATION_FAILED");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return failure("INVALID_EMAIL");
  if (fields.documentLink) {
    try { const url = new URL(fields.documentLink); if (!/^(https?):$/.test(url.protocol)) return failure("INVALID_DOCUMENT_LINK"); }
    catch { return failure("INVALID_DOCUMENT_LINK"); }
  }

  const maxBytes = Math.max(1, Number(process.env.RFQ_MAX_FILE_SIZE_MB ?? 15)) * 1024 * 1024 || defaultMaxBytes;
  const files = incoming.getAll("documents").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length > maxFiles) return failure("TOO_MANY_FILES");
  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.has(extension) || (file.type && !allowedMimeTypes.has(file.type))) return failure("UNSUPPORTED_FILE_TYPE");
    if (file.size > maxBytes) return failure("FILE_TOO_LARGE", 413);
  }

  const endpoint = process.env.INQUIRY_SUBMISSION_ENDPOINT;
  const token = process.env.INQUIRY_SUBMISSION_TOKEN;
  if (!endpoint || !token) return failure("CONFIGURATION_REQUIRED", 503);

  const outbound = new FormData();
  Object.entries(fields).forEach(([key, value]) => outbound.set(key, value));
  outbound.set("destinationEmail", process.env.INQUIRY_DESTINATION_EMAIL ?? "info@bps-sourcing.de");
  outbound.set("storageProvider", process.env.RFQ_STORAGE_PROVIDER ?? "");
  outbound.set("storageBucket", process.env.RFQ_STORAGE_BUCKET ?? "");
  outbound.set("retentionDays", process.env.RFQ_RETENTION_DAYS ?? "30");
  outbound.set("privacyAcceptedAt", new Date().toISOString());
  for (const file of files) outbound.append("documents", file, safeFilename(file.name));

  try {
    const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, body: outbound, redirect: "error" });
    if (!response.ok) return failure("DELIVERY_FAILED", 502);
    return NextResponse.json({ ok: true });
  } catch {
    return failure("DELIVERY_FAILED", 502);
  }
}
