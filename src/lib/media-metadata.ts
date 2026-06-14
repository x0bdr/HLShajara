/**
 * Video metadata stripping (Phase 33 BE-05).
 *
 * SYSTEM DEPENDENCY: the ffmpeg binary must be installed on any host that enables
 * video uploads. This module shells out to the ffmpeg CLI (mirroring the clamav.ts
 * exec/promisify/tmp-file/cleanup pattern) — there is NO node package dependency
 * and no bundled binary wrapper. If the binary is absent, callers must fail
 * closed (reject the upload) rather than store a video with intact metadata.
 *
 * `ffmpeg -map_metadata -1` strips all global + per-stream metadata (GPS, device,
 * timestamps) that could de-anonymize a submitter or victim. `-c copy` avoids a
 * re-encode (metadata-only strip, fast, bounded).
 *
 * Only Node built-ins are imported here.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomBytes } from "crypto";

const execAsync = promisify(exec);

const VERSION_TIMEOUT_MS = 5_000;
const STRIP_TIMEOUT_MS = 60_000;

/**
 * Resolve true when `ffmpeg -version` exits 0, false on any error (missing binary,
 * non-zero exit, timeout). Never throws.
 */
export async function isFfmpegAvailable(): Promise<boolean> {
  try {
    await execAsync("ffmpeg -version", { timeout: VERSION_TIMEOUT_MS });
    return true;
  } catch {
    return false;
  }
}

/**
 * Strip all container + stream metadata from a video buffer via
 * `ffmpeg -map_metadata -1 -c copy`.
 *
 * Writes the input to a server-generated random tmp file (NEVER the client
 * filename — no user string is interpolated into the command beyond the
 * controlled tmp paths), runs ffmpeg to a tmp output, returns the stripped
 * buffer, and deletes both tmp files in a finally block.
 *
 * Throws a clear Error if ffmpeg fails, so the route can fail closed and never
 * store an unstripped video.
 *
 * @param buffer the original video bytes
 * @param ext    the file extension (e.g. ".mp4"); a server-sanitized value, used
 *               only to give the tmp files a container ffmpeg recognizes.
 */
export async function stripVideoMetadata(buffer: Buffer, ext: string): Promise<Buffer> {
  // Sanitize the extension to a conservative whitelist of chars so it can never
  // break out of the tmp path or the shell command.
  const safeExt = /^\.[A-Za-z0-9]{1,8}$/.test(ext) ? ext : ".mp4";
  const token = randomBytes(16).toString("hex");
  const inPath = join(tmpdir(), `hlshajara-vid-in-${token}${safeExt}`);
  const outPath = join(tmpdir(), `hlshajara-vid-out-${token}${safeExt}`);

  try {
    await fs.writeFile(inPath, buffer);

    // -y overwrite, -i input, -map_metadata -1 drop all metadata, -c copy no re-encode.
    await execAsync(
      `ffmpeg -y -i "${inPath}" -map_metadata -1 -c copy "${outPath}"`,
      { timeout: STRIP_TIMEOUT_MS }
    );

    return await fs.readFile(outPath);
  } catch (err) {
    throw new Error(
      `ffmpeg failed to strip video metadata: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    await fs.unlink(inPath).catch(() => {});
    await fs.unlink(outPath).catch(() => {});
  }
}
