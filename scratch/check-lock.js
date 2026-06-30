const fs = require("fs");
const lock = JSON.parse(fs.readFileSync("package-lock.json", "utf8"));

const pkg = lock.packages["node_modules/@yourcompany/global-backend-next"] || lock.packages["src/sdk/yourcompany-global-backend-next-1.0.1.tgz"];
console.log("PACKAGE ENTRY IN LOCKFILE:", pkg);
