const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const appDir = path.join(root, "src", "app", "[locale]");
const apiDir = path.join(root, "src", "app", "api");
const backupRoot = path.join(root, ".static-export-backup");

// Client routes that use force-dynamic and cannot be statically exported.
// They are temporarily moved aside during the static build and restored after.
const dynamicClientRoutes = [
  "admin",
  "auth/error",
  "login",
  "profile",
  "publications",
  "reviewer",
];

const moved = [];

function moveAside(relRoute) {
  const source = path.join(appDir, relRoute);
  const dest = path.join(backupRoot, relRoute);

  if (!fs.existsSync(source)) {
    console.log(`[build-static] Skip (not found): ${source}`);
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(source, dest);
  moved.push({ source, dest });
  console.log(`[build-static] Moved aside: ${source} → ${dest}`);
}

function restoreAll() {
  for (const { source, dest } of moved) {
    if (fs.existsSync(dest)) {
      fs.renameSync(dest, source);
      console.log(`[build-static] Restored: ${source}`);
    }
  }

  // Clean up empty backup directories if any remain.
  try {
    fs.rmSync(backupRoot, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors; restoration is what matters.
  }
}

let apiMoved = false;

function cleanupApi() {
  if (apiMoved && fs.existsSync(path.join(root, ".api-backup"))) {
    fs.renameSync(path.join(root, ".api-backup"), apiDir);
    console.log("[build-static] Restored src/app/api");
  }
}

let exitCode = 0;

try {
  // Move API routes aside.
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, path.join(root, ".api-backup"));
    apiMoved = true;
    console.log("[build-static] Moved src/app/api → .api-backup");
  }

  // Move force-dynamic client routes aside.
  for (const route of dynamicClientRoutes) {
    moveAside(route);
  }

  process.env.EXPORT_STATIC = "1";
  execSync("next build", { stdio: "inherit", cwd: root });
} catch (err) {
  exitCode = err.status || 1;
} finally {
  restoreAll();
  cleanupApi();
}

process.exit(exitCode);
