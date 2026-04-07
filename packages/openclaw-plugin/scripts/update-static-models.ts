#!/usr/bin/env npx tsx
/**
 * Fetches models from the EUrouter API and regenerates static-models.ts.
 *
 * Usage:
 *   npx tsx scripts/update-static-models.ts
 */

import { mapEurouterModel, type EurouterModel } from "../src/provider-catalog.js";

const API_URL = "https://api.eurouter.ai/api/v1/models";

async function main() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    console.error(`Failed to fetch models: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const json = (await res.json()) as { data: EurouterModel[] };
  const models = json.data.map(mapEurouterModel);

  const lines = models.map((m) => {
    const cost = `{ input: ${m.cost.input}, output: ${m.cost.output}, cacheRead: ${m.cost.cacheRead}, cacheWrite: ${m.cost.cacheWrite} }`;
    const input = JSON.stringify(m.input);
    return `  { id: ${JSON.stringify(m.id)}, name: ${JSON.stringify(m.name)}, reasoning: ${m.reasoning}, input: ${input}, cost: ${cost}, contextWindow: ${m.contextWindow}, maxTokens: ${m.maxTokens} },`;
  });

  const output = `// Auto-generated from ${API_URL}
import type { OpenClawModel } from "./provider-catalog.js";

export const STATIC_MODELS: OpenClawModel[] = [
${lines.join("\n")}
];
`;

  const fs = await import("node:fs");
  const path = await import("node:path");
  const outPath = path.resolve(import.meta.dirname, "../src/static-models.ts");
  fs.writeFileSync(outPath, output);
  console.log(`Wrote ${models.length} models to ${outPath}`);
}

main();
