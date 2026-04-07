/**
 * EUrouter → OpenClaw model catalog
 *
 * Mapping and dynamic resolution for the EUrouter provider plugin.
 * All models are fetched from the EUrouter /models endpoint.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Subset of the EUrouter /models response we actually consume. */
export interface EurouterModel {
  id: string;
  name: string;
  context_length: number | null;
  pricing?: {
    prompt: string;
    completion: string;
    request: string;
    image: string;
    image_token: string;
    image_output: string;
    audio: string;
    input_audio_cache: string;
    web_search: string;
    internal_reasoning: string;
    input_cache_read: string;
    input_cache_write: string;
    discount: number;
  };
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
    tokenizer: string | null;
    instruct_type: string | null;
  };
  top_provider: {
    context_length: number | null;
    max_completion_tokens: number | null;
    is_moderated: boolean;
  };
  supported_parameters: string[];
  tags?: string[];
}

/** OpenClaw catalog model shape. */
export interface OpenClawModel {
  id: string;
  name: string;
  reasoning: boolean;
  input: string[];
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };
  contextWindow: number;
  maxTokens: number;
}

// ---------------------------------------------------------------------------
// Provider prefix handling
// ---------------------------------------------------------------------------

/**
 * Strip the "eurouter/" provider prefix from a model ID.
 * OpenClaw passes model IDs as "eurouter/gpt-4o" but the EUrouter API
 * only knows bare IDs like "gpt-4o".
 */
export function stripProviderPrefix(modelId: string): string {
  return modelId.replace(/^eurouter\//, "");
}

// ---------------------------------------------------------------------------
// Cost conversion
// ---------------------------------------------------------------------------

/**
 * Convert a per-token price string to a per-million-token number.
 * EUrouter prices are strings like "0.0000025" (per token).
 * OpenClaw expects numbers per 1M tokens.
 */
export function toPerMillion(price: string | undefined): number {
  if (price === undefined || price === null) return 0;
  const n = parseFloat(price);
  if (isNaN(n)) return 0;
  return n * 1_000_000;
}

// ---------------------------------------------------------------------------
// Model mapping
// ---------------------------------------------------------------------------

/** Detect reasoning capability from tags or supported_parameters. */
function isReasoningModel(model: EurouterModel): boolean {
  if (model.tags?.includes("reasoning")) return true;
  return model.supported_parameters.some((p) =>
    ["reasoning", "include_reasoning", "reasoning_effort"].includes(p)
  );
}

/** Map a single EUrouter model to the OpenClaw catalog format. */
export function mapEurouterModel(model: EurouterModel): OpenClawModel {
  const pricing = model.pricing;
  return {
    id: model.id,
    name: model.name,
    reasoning: isReasoningModel(model),
    input: model.architecture.input_modalities,
    cost: {
      input: toPerMillion(pricing?.prompt),
      output: toPerMillion(pricing?.completion),
      cacheRead: toPerMillion(pricing?.input_cache_read),
      cacheWrite: toPerMillion(pricing?.input_cache_write),
    },
    contextWindow: model.context_length ?? 128_000,
    maxTokens: model.top_provider.max_completion_tokens ?? 4096,
  };
}

// ---------------------------------------------------------------------------
// API key validation
// ---------------------------------------------------------------------------

export function validateApiKey(key: string | undefined): boolean {
  if (!key) return false;
  return key.startsWith("eur_");
}

// ---------------------------------------------------------------------------
// Model fetcher (with in-memory cache)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedModels: OpenClawModel[] | null = null;
let cacheBaseUrl: string | null = null;
let cacheTimestamp = 0;

/** Clear the in-memory cache (exposed for testing). */
export function clearModelCache(): void {
  cachedModels = null;
  cacheBaseUrl = null;
  cacheTimestamp = 0;
}

/**
 * Fetch all models from the EUrouter /models endpoint.
 * Results are cached in memory for 5 minutes.
 * The endpoint is public (no auth needed).
 */
export async function fetchAllModels(
  baseUrl: string
): Promise<OpenClawModel[]> {
  const now = Date.now();

  if (
    cachedModels &&
    cacheBaseUrl === baseUrl &&
    now - cacheTimestamp < CACHE_TTL_MS
  ) {
    return cachedModels;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${baseUrl}/models`, {
      signal: controller.signal,
    });
    if (!res.ok) return cachedModels ?? [];

    const json = (await res.json()) as { data: EurouterModel[] };
    cachedModels = json.data.map(mapEurouterModel);
    cacheBaseUrl = baseUrl;
    cacheTimestamp = now;

    return cachedModels;
  } catch {
    return cachedModels ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve a single model by id from the EUrouter /models endpoint.
 * Returns undefined if the model is not found.
 */
export async function resolveDynamicModel(
  baseUrl: string,
  modelId: string
): Promise<OpenClawModel | undefined> {
  const bareId = stripProviderPrefix(modelId);
  const models = await fetchAllModels(baseUrl);
  return models.find((m) => m.id === bareId);
}
