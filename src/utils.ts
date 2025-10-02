import fs from "fs";
import path from "path";
import { DATA_DIR } from "./env";
import { DataKind } from "./types";

export async function delay(ms: number): Promise<void> {
  await new Promise((res) => setTimeout(res, ms));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export async function saveJson(
  username: string,
  kind: DataKind,
  data: unknown
): Promise<string> {
  const outDir = path.join(DATA_DIR, username, kind);
  await fs.promises.mkdir(outDir, { recursive: true });
  const epoch = Date.now();
  const outPath = path.join(outDir, `${epoch}-${kind}.json`);
  await fs.promises.writeFile(outPath, JSON.stringify(data, null, 2), {
    encoding: "utf-8",
  });
  return outPath;
}
