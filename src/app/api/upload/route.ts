import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { createHash } from "crypto";
import path from "path";
import sharp from "sharp";
import { scanBuffer } from "@/lib/clamav";
import { isFfmpegAvailable, stripVideoMetadata } from "@/lib/media-metadata";
import { rateLimitResponse } from "@/lib/rate-limit";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "image/avif",
]);

// Phase 33 (BE-05): video MIME types whose metadata is stripped via ffmpeg before
// storage. Conservative set; extend deliberately. NOTE: video uploads require the
// ffmpeg system binary — when absent the branch below fails closed (503).
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export async function POST(request: Request) {
  const rl = await rateLimitResponse(request, { windowMs: 60_000, maxRequests: 10 });
  if (!rl.ok) return rl.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, message: "No file provided" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, message: "File too large (max 10 MB)" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    // Strip EXIF/GPS metadata from images using Sharp
    if (IMAGE_TYPES.has(file.type)) {
      try {
        buffer = Buffer.from(await sharp(buffer).rotate().toBuffer());
      } catch (err) {
        console.error("Sharp processing error:", err);
        // Fall through to save original if Sharp fails
      }
    } else if (VIDEO_TYPES.has(file.type)) {
      // Phase 33 (BE-05): strip container/stream metadata from videos via
      // `ffmpeg -map_metadata -1` BEFORE the malware scan and hash. ffmpeg is a
      // required system binary for video uploads — if it is unavailable, or if the
      // strip fails, FAIL CLOSED with 503 (never store a video with intact metadata).
      if (!(await isFfmpegAvailable())) {
        return NextResponse.json(
          {
            ok: false,
            code: "FFMPEG_UNAVAILABLE",
            message:
              "Video uploads are temporarily unavailable (the video processor is not installed). Please try again later or upload an image/document.",
          },
          { status: 503 }
        );
      }
      try {
        buffer = Buffer.from(await stripVideoMetadata(buffer, path.extname(file.name)));
      } catch (err) {
        console.error("Video metadata strip error:", err);
        return NextResponse.json(
          {
            ok: false,
            code: "FFMPEG_UNAVAILABLE",
            message:
              "Video could not be processed safely and was not stored. Please try again later.",
          },
          { status: 503 }
        );
      }
    }

    // Malware scan
    const scan = await scanBuffer(buffer, file.name);
    if (!scan.clean) {
      return NextResponse.json(
        { ok: false, code: "MALWARE_DETECTED", message: `Malware detected: ${scan.virus}` },
        { status: 400 }
      );
    }

    const hash = createHash("sha256").update(buffer).digest("hex");
    const ext = path.extname(file.name) || "";
    const safeName = `${hash}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(filePath, buffer);

    return NextResponse.json({
      ok: true,
      hash,
      filename: safeName,
      originalName: file.name,
      size: buffer.length,
      url: `/uploads/${safeName}`,
    });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { ok: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}
