import { NextRequest } from "next/server";
import { storageService } from "@/lib/storage/StorageService";
import { fail, handleRouteError } from "@/lib/api/response";
import path from "path";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: parts } = await context.params;
    const relativePath = parts.join("/");
    if (!relativePath || relativePath.includes("..")) {
      return fail("Invalid path", "INVALID_PATH", 400);
    }

    if (!(await storageService.exists(relativePath))) {
      return fail("File not found", "FILE_NOT_FOUND", 404);
    }

    const buffer = await storageService.read(relativePath);
    const ext = path.extname(relativePath).toLowerCase();
    const contentType = MIME[ext] || "application/octet-stream";

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
