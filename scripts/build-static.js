const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const apiDir = path.join(root, "src", "app", "api");
const backupDir = path.join(root, ".api-backup");

let moved = false;

try {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, backupDir);
    moved = true;
    console.log("[build-static] Moved src/app/api → .api-backup");
  }

  process.env.EXPORT_STATIC = "1";
  execSync("next build", { stdio: "inherit", cwd: root });
} catch (err) {
  process.exitCode = err.status || 1;
} finally {
  if (moved && fs.existsSync(backupDir)) {
    fs.renameSync(backupDir, apiDir);
    console.log("[build-static] Restored src/app/api");
  }
}
