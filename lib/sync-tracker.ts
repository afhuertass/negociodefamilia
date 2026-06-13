import fs from "fs";
import path from "path";

const TEMP_FILE = path.join("/tmp", "last-match-sync.txt");

export function getLastSyncTime(): number {
  try {
    if (fs.existsSync(TEMP_FILE)) {
      return parseInt(fs.readFileSync(TEMP_FILE, "utf-8"), 10) || 0;
    }
  } catch (e) {
    console.error("Failed to read last sync file:", e);
  }
  return 0;
}

export function updateLastSyncTime(): void {
  try {
    fs.writeFileSync(TEMP_FILE, String(Date.now()), "utf-8");
  } catch (e) {
    console.error("Failed to write last sync file:", e);
  }
}
