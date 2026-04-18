import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sha = process.env.RAILWAY_GIT_COMMIT_SHA ?? "";

mkdirSync(join(root, "src/generated"), { recursive: true });
writeFileSync(
  join(root, "src/generated/build-sha.json"),
  JSON.stringify({ sha })
);

console.log(`Build SHA: ${sha || "(none)"}`);
