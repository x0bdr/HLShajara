const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appDir = path.join(root, "src", "app", "[locale]");
const apiDir = path.join(root, "src", "app", "api");
const backupRoot = path.join(root, ".static-export-backup");
const apiBackupDir = path.join(root, ".api-backup");

// Client routes that use force-dynamic and cannot be statically exported.
// They are temporarily removed during the static build and restored after.
const dynamicClientRoutes = [
  "admin",
  "auth/error",
  "login",
  "profile",
  "reviewer",
  "publications/[slug]",
];

const moved = [];

function abortIfStaleBackup(dir) {
  if (fs.existsSync(dir)) {
    throw new Error(
      `[build-static] stale backup directory already exists: ${dir}\n` +
        `Remove it manually and re-run if a previous build was interrupted.`
    );
  }
}

function copyAside(relRoute) {
  const source = path.join(appDir, relRoute);
  const dest = path.join(backupRoot, relRoute);

  if (!fs.existsSync(source)) {
    console.log(`[build-static] Skip (not found): ${source}`);
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(source, dest, { recursive: true, force: true });
  moved.push({ source, dest });
  console.log(`[build-static] Backed up: ${source} → ${dest}`);
}

function removeSource(relPath) {
  const target = path.join(appDir, relPath);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`[build-static] Removed for export: ${target}`);
  }
}

function restoreAll() {
  for (const { source, dest } of moved) {
    if (fs.existsSync(dest)) {
      fs.rmSync(source, { recursive: true, force: true });
      fs.cpSync(dest, source, { recursive: true, force: true });
      console.log(`[build-static] Restored: ${source}`);
    }
  }

  try {
    fs.rmSync(backupRoot, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors; restoration is what matters.
  }
}

function backupApi() {
  if (fs.existsSync(apiDir)) {
    fs.cpSync(apiDir, apiBackupDir, { recursive: true, force: true });
    console.log("[build-static] Backed up src/app/api → .api-backup");
  }
}

function removeApi() {
  if (fs.existsSync(apiDir)) {
    fs.rmSync(apiDir, { recursive: true, force: true });
    console.log("[build-static] Removed for export: src/app/api");
  }
}

function restoreApi() {
  if (fs.existsSync(apiBackupDir)) {
    fs.rmSync(apiDir, { recursive: true, force: true });
    fs.cpSync(apiBackupDir, apiDir, { recursive: true, force: true });
    console.log("[build-static] Restored src/app/api");
    try {
      fs.rmSync(apiBackupDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors.
    }
  }
}

let exitCode = 0;

try {
  abortIfStaleBackup(apiBackupDir);
  abortIfStaleBackup(backupRoot);

  backupApi();
  removeApi();

  for (const route of dynamicClientRoutes) {
    copyAside(route);
    removeSource(route);
  }

  process.env.EXPORT_STATIC = "1";
  execSync("next build", { stdio: "inherit", cwd: root });
} catch (err) {
  console.error("[build-static] Build failed:", err.message || err);
  exitCode = err.status || 1;
} finally {
  restoreAll();
  restoreApi();
}

process.exit(exitCode);
