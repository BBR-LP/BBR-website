// What the upload page accepts, shared by the form (to tell people early) and the server (which decides).
// The server never trusts the browser: it applies these again, and builds the Dropbox path itself.
import type { SiteSlug } from "../template/types";

export const MAX_FILES = 10;
export const MAX_BYTES = 40 * 1024 * 1024; // a phone photo is 3 to 12 MB; this leaves room for a big original
export const EXTENSIONS = ["jpg", "jpeg", "png", "heic", "heif", "webp"];
export const ACCEPT = "image/*,.heic,.heif";

export type Source = "staff" | "guests";
export type FileInfo = { name: string; size: number };

// "staff" only when the link says so (the sticker's ?s=staff). It is not a secret and earns no extra trust:
// it only decides which folder a photo lands in.
export const sourceFrom = (tag: unknown): Source => (tag === "staff" ? "staff" : "guests");

const extension = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

export function checkFiles(files: FileInfo[]): string | null {
  if (files.length === 0) return "Choose at least one photo.";
  if (files.length > MAX_FILES) return `Please send up to ${MAX_FILES} photos at a time.`;
  for (const f of files) {
    if (!EXTENSIONS.includes(extension(f.name))) return `"${f.name}" isn't a photo we can take. Please send JPG, PNG, HEIC or WebP pictures.`;
    if (f.size <= 0) return `"${f.name}" is empty.`;
    if (f.size > MAX_BYTES) return `"${f.name}" is too big (the limit is ${MAX_BYTES / 1024 / 1024} MB).`;
  }
  return null;
}

// Letters only, so the name is safe in a file name and reads as a credit later.
export function cleanFirstName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.normalize("NFKD").replace(/[^\p{L}\s'-]/gu, "").replace(/\p{M}/gu, "").trim().replace(/\s+/g, "-");
  return name.length >= 1 && name.length <= 30 ? name : null;
}

// Keep the original file's name (people recognise it), made safe.
export const safeFileName = (name: string) =>
  name.replace(/[/\\]/g, "_").replace(/[^\w.\- ]/g, "_").replace(/\s+/g, "_").replace(/\.{2,}/g, ".").replace(/^[.\-_]+/, "").slice(-80) || "photo.jpg";

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15); // 20261022-153012

// /<site>/<staff|guests>/<upload time>_<first name>_<original name>. The credit travels in the file name, the
// capture date and location stay inside the file. Built here, never from anything the browser sends as a path.
export const uploadPath = (site: SiteSlug, source: Source, firstName: string, fileName: string, now = new Date()) =>
  `/${site}/${source}/${stamp(now)}_${firstName}_${safeFileName(fileName)}`;
