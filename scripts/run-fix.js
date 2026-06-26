const { execSync } = require("child_process");
const path = require("path");
const scriptDir = path.resolve(__dirname);
process.chdir(scriptDir);
execSync(`node ${path.join(scriptDir, "fix-home-page.js")}`, { stdio: "inherit", cwd: scriptDir });
