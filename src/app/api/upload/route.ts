import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { createHash } from "crypto";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
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
    const buffer = Buffer.from(bytes);

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
      size: file.size,
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
