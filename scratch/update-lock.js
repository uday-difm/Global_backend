const fs = require("fs");
const file = "package-lock.json";
let content = fs.readFileSync(file, "utf8");

// We replace the old integrity hash with the new one
const oldHash = "sha512-PnI6NwLxsy7AxzmThqT56hmOnrK7cBya3s1oin+IhkIJDgXgCDGCXEwMRTYQ2hDJEVzziUjc5lWXREdXD7XKTw==";
const newHash = "sha512-Ijun+njWrAOqQjGen0VanJ8KPf6dOK1X4kFGT5Vp2/jdkbMKNoqfdWHlfWFs2pefxs0qjLzPORprmAbyehnB6g==";

if (content.includes(oldHash)) {
  content = content.split(oldHash).join(newHash);
  fs.writeFileSync(file, content, "utf8");
  console.log("SUCCESS: package-lock.json updated with new integrity hash!");
} else {
  console.log("WARNING: Old integrity hash not found in package-lock.json.");
}
