import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { AppError } from "@/lib/api/response";

export type StoredFile = {
  relativePath: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  absolutePath: string;
};

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
]);

const BANNER_MIME = new Set([...IMAGE_MIME, ...VIDEO_MIME]);

const AUDIO_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/m4a",
  "audio/aac",
  "audio/ogg",
]);

function storageRoot(): string {
  const configured = process.env.STORAGE_PATH || "storage";
  return path.isAbsolute(configured)
    ? configured
    : path.join(/*turbopackIgnore: true*/ process.cwd(), configured);
}

function safeExt(filename: string, mimeType: string): string {
  const fromName = path.extname(filename).toLowerCase().replace(".", "");
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "video/x-m4v": "m4v",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "m4a",
    "audio/m4a": "m4a",
    "audio/aac": "aac",
    "audio/ogg": "ogg",
  };
  return map[mimeType] || "bin";
}

export class LocalStorageService {
  async ensureDir(relativeDir: string): Promise<string> {
    const absolute = path.join(storageRoot(), relativeDir);
    await fs.mkdir(absolute, { recursive: true });
    return absolute;
  }

  resolve(relativePath: string): string {
    const normalized = relativePath.replace(/^[/\\]+/, "").replace(/\\/g, "/");
    const absolute = path.join(storageRoot(), normalized);
    const root = storageRoot();
    if (!absolute.startsWith(root)) {
      throw new AppError("Invalid storage path", "INVALID_PATH", 400);
    }
    return absolute;
  }

  getUrl(relativePath: string): string {
    const clean = relativePath.replace(/^[/\\]+/, "").replace(/\\/g, "/");
    const base = process.env.APP_URL?.replace(/\/$/, "") || "";
    return `${base}/api/storage/${clean}`;
  }

  async exists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(relativePath));
      return true;
    } catch {
      return false;
    }
  }

  async delete(relativePath: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(relativePath));
    } catch {
      // ignore missing files
    }
  }

  async upload(
    file: File,
    relativeDir: string,
    options?: {
      maxBytes?: number;
      allowedMime?: Set<string>;
      kind?: "image" | "audio" | "banner" | "any";
    },
  ): Promise<StoredFile> {
    const maxBytes = options?.maxBytes ?? 25 * 1024 * 1024;
    const kind = options?.kind ?? "any";
    const allowed =
      options?.allowedMime ??
      (kind === "image"
        ? IMAGE_MIME
        : kind === "audio"
          ? AUDIO_MIME
          : kind === "banner"
            ? BANNER_MIME
            : null);

    if (file.size <= 0) {
      throw new AppError("Empty file", "EMPTY_FILE", 400);
    }
    if (file.size > maxBytes) {
      throw new AppError("File too large", "FILE_TOO_LARGE", 400);
    }

    const mimeType = file.type || "application/octet-stream";
    if (allowed && !allowed.has(mimeType)) {
      throw new AppError("Unsupported file type", "INVALID_FILE_TYPE", 400);
    }

    const storedName = `${nanoid(16)}.${safeExt(file.name, mimeType)}`;
    const relativePath = path.posix.join(
      relativeDir.replace(/\\/g, "/"),
      storedName,
    );
    await this.ensureDir(relativeDir);
    const absolutePath = this.resolve(relativePath);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, buffer);

    return {
      relativePath,
      storedName,
      mimeType,
      fileSize: buffer.length,
      absolutePath,
    };
  }

  async read(relativePath: string): Promise<Buffer> {
    return fs.readFile(this.resolve(relativePath));
  }
}

export const storageService = new LocalStorageService();
