/**
 * ClamAV file scanning wrapper.
 * Falls back to a no-op if clamdscan/clamscan is not installed.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { createWriteStream, promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const execAsync = promisify(exec);

export interface ScanResult {
  clean: boolean;
  virus?: string;
  error?: string;
}

async function scanWithClamdscan(filePath: string): Promise<ScanResult | null> {
  try {
    const { stdout, stderr } = await execAsync(`clamdscan --no-summary "${filePath}"`, { timeout: 30_000 });
    if (stdout.includes("OK")) return { clean: true };
    if (stdout.includes("FOUND")) {
      const match = stdout.match(/: (.+) FOUND/);
      return { clean: false, virus: match?.[1] ?? "unknown" };
    }
    return null;
  } catch (err: any) {
    if (err.stdout?.includes("FOUND")) {
      const match = err.stdout.match(/: (.+) FOUND/);
      return { clean: false, virus: match?.[1] ?? "unknown" };
    }
    return null;
  }
}

async function scanWithClamscan(filePath: string): Promise<ScanResult | null> {
  try {
    const { stdout } = await execAsync(`clamscan --no-summary "${filePath}"`, { timeout: 30_000 });
    if (stdout.includes("OK")) return { clean: true };
    if (stdout.includes("FOUND")) {
      const match = stdout.match(/: (.+) FOUND/);
      return { clean: false, virus: match?.[1] ?? "unknown" };
    }
    return null;
  } catch (err: any) {
    if (err.stdout?.includes("FOUND")) {
      const match = err.stdout.match(/: (.+) FOUND/);
      return { clean: false, virus: match?.[1] ?? "unknown" };
    }
    return null;
  }
}

/**
 * Scan a file buffer for malware.
 * Writes to a temp file, scans with ClamAV, then cleans up.
 * If ClamAV is not installed, returns clean=true with a warning logged.
 */
export async function scanBuffer(buffer: Buffer, originalName: string): Promise<ScanResult> {
  const tmpPath = join(tmpdir(), `hlshajara-scan-${Date.now()}-${originalName}`);

  try {
    await fs.writeFile(tmpPath, buffer);

    // Try clamdscan first (daemon, faster), then clamscan
    let result = await scanWithClamdscan(tmpPath);
    if (!result) result = await scanWithClamscan(tmpPath);

    if (!result) {
      console.warn("[ClamAV] Scanner not available — skipping malware check. Install clamdscan or clamscan.");
      return { clean: true };
    }

    return result;
  } finally {
    try {
      await fs.unlink(tmpPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

/**
 * Scan an existing file path.
 */
export async function scanFile(filePath: string): Promise<ScanResult> {
  let result = await scanWithClamdscan(filePath);
  if (!result) result = await scanWithClamscan(filePath);

  if (!result) {
    console.warn("[ClamAV] Scanner not available — skipping malware check.");
    return { clean: true };
  }

  return result;
}
