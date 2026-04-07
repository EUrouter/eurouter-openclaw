import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  PROVIDER_ID,
  DEFAULT_BASE_URL,
  ATTRIBUTION_HEADERS,
  TRANSPORT_API,
} from "../src/index.js";
import plugin from "../src/index.js";
import { clearModelCache, type EurouterModel } from "../src/provider-catalog.js";

// ---------------------------------------------------------------------------
// Plugin entry constants
// ---------------------------------------------------------------------------
describe("plugin entry constants", () => {
  it('exports provider id as "eurouter"', () => {
    expect(PROVIDER_ID).toBe("eurouter");
  });

  it("exports the correct default base URL", () => {
    expect(DEFAULT_BASE_URL).toBe("https://api.eurouter.ai/api/v1");
  });

  it('exports transport api as "openai-completions"', () => {
    expect(TRANSPORT_API).toBe("openai-completions");
  });
});

// ---------------------------------------------------------------------------
// Attribution headers
// ---------------------------------------------------------------------------
describe("attribution headers", () => {
  it("includes HTTP-Referer", () => {
    expect(ATTRIBUTION_HEADERS["HTTP-Referer"]).toBe("https://openclaw.ai");
  });

  it("includes X-EUrouter-Title", () => {
    expect(ATTRIBUTION_HEADERS["X-EUrouter-Title"]).toBe("OpenClaw");
  });

  it("includes X-EUrouter-Categories", () => {
    expect(ATTRIBUTION_HEADERS["X-EUrouter-Categories"]).toBe("cli-agent");
  });
});

// ---------------------------------------------------------------------------
// Helpers for plugin handler tests
// ---------------------------------------------------------------------------

const mockApiModels: EurouterModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    context_length: 128000,
    pricing: {
      prompt: "0.0000025",
      completion: "0.00001",
      request: "0",
      image: "0",
      image_token: "0",
      image_output: "0",
      audio: "0",
      input_audio_cache: "0",
      web_search: "0",
      internal_reasoning: "0",
      input_cache_read: "0.000001",
      input_cache_write: "0",
      discount: 0,
    },
    architecture: {
      modality: "multimodal",
      input_modalities: ["text", "image"],
      output_modalities: ["text"],
      tokenizer: "o200k_base",
      instruct_type: null,
    },
    top_provider: {
      context_length: 128000,
      max_completion_tokens: 16384,
      is_moderated: true,
    },
    supported_parameters: ["temperature", "top_p"],
    tags: ["flagship"],
  },
];

/** Capture the provider config passed to registerProvider. */
function registerPlugin() {
  let registered: any = null;
  const api = {
    registerProvider(config: any) {
      registered = config;
    },
  };
  plugin.register(api);
  return registered;
}

// ---------------------------------------------------------------------------
// catalog.run() — should use live API models (bug 3.1)
// ---------------------------------------------------------------------------
describe("catalog.run()", () => {
  beforeEach(() => {
    clearModelCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockApiModels }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches live models from the API instead of only using static list", async () => {
    const provider = registerPlugin();
    const ctx = {
      resolveProviderApiKey: () => ({ apiKey: "eur_test123" }),
      pluginConfig: {},
    };
    const result = await provider.catalog.run(ctx);
    expect(fetch).toHaveBeenCalled();
    expect(result.provider.models).toBeDefined();
    // Live API model should be present
    const gpt4o = result.provider.models.find((m: any) => m.id === "gpt-4o");
    expect(gpt4o).toBeDefined();
    expect(gpt4o.cost.input).toBe(2.5);
  });

  it("falls back to static models when API fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error"))
    );
    const provider = registerPlugin();
    const ctx = {
      resolveProviderApiKey: () => ({ apiKey: "eur_test123" }),
      pluginConfig: {},
    };
    const result = await provider.catalog.run(ctx);
    expect(result.provider.models.length).toBeGreaterThan(0);
  });

  it("includes attribution headers on each model", async () => {
    const provider = registerPlugin();
    const ctx = {
      resolveProviderApiKey: () => ({ apiKey: "eur_test123" }),
      pluginConfig: {},
    };
    const result = await provider.catalog.run(ctx);
    for (const model of result.provider.models) {
      expect(model.headers).toEqual(ATTRIBUTION_HEADERS);
    }
  });
});

// ---------------------------------------------------------------------------
// resolveDynamicModel handler — sync, returns stub or prepared data
// ---------------------------------------------------------------------------
describe("resolveDynamicModel handler", () => {
  beforeEach(() => {
    clearModelCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockApiModels }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a fallback stub before prepareDynamicModel runs", () => {
    const provider = registerPlugin();
    const ctx = { modelId: "eurouter/gpt-4o" };
    const result = provider.resolveDynamicModel(ctx);
    expect(result.id).toBe("eurouter/gpt-4o");
    expect(result.provider).toBe("eurouter");
    expect(result.headers).toEqual(ATTRIBUTION_HEADERS);
  });

  it("returns real model data after prepareDynamicModel populates ctx", async () => {
    const provider = registerPlugin();
    const ctx: any = { modelId: "eurouter/gpt-4o" };
    await provider.prepareDynamicModel(ctx);
    const result = provider.resolveDynamicModel(ctx);
    expect(result.id).toBe("eurouter/gpt-4o");
    expect(result.contextWindow).toBe(128000);
    expect(result.maxTokens).toBe(16384);
    expect(result.cost.input).toBe(2.5);
    expect(result.cost.output).toBe(10);
    expect(result.headers).toEqual(ATTRIBUTION_HEADERS);
  });
});

// ---------------------------------------------------------------------------
// prepareDynamicModel handler — should strip prefix (bug 1.1)
// ---------------------------------------------------------------------------
describe("prepareDynamicModel handler", () => {
  beforeEach(() => {
    clearModelCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockApiModels }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves a model using a provider-prefixed id", async () => {
    const provider = registerPlugin();
    const ctx: any = { modelId: "eurouter/gpt-4o" };
    await provider.prepareDynamicModel(ctx);
    expect(ctx.dynamicModelData).toBeDefined();
    expect(ctx.dynamicModelData.contextWindow).toBe(128000);
    expect(ctx.dynamicModelData.maxTokens).toBe(16384);
  });

  it("throws when the model cannot be resolved (bug 1.3)", async () => {
    const provider = registerPlugin();
    const ctx: any = { modelId: "eurouter/nonexistent-model" };
    await expect(provider.prepareDynamicModel(ctx)).rejects.toThrow();
  });
});
