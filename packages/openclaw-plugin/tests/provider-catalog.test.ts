import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  toPerMillion,
  mapEurouterModel,
  validateApiKey,
  fetchAllModels,
  resolveDynamicModel,
  clearModelCache,
  type EurouterModel,
} from "../src/provider-catalog.js";

// ---------------------------------------------------------------------------
// 1. Cost conversion
// ---------------------------------------------------------------------------
describe("toPerMillion", () => {
  it("converts a string price to per-million-token number", () => {
    expect(toPerMillion("0.0000025")).toBe(2.5);
  });

  it("handles zero", () => {
    expect(toPerMillion("0")).toBe(0);
  });

  it("returns 0 for undefined input", () => {
    expect(toPerMillion(undefined)).toBe(0);
  });

  it("handles very small prices", () => {
    expect(toPerMillion("0.000000001")).toBeCloseTo(0.001, 6);
  });

  it("handles larger prices", () => {
    expect(toPerMillion("0.00006")).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// 2. Model mapping
// ---------------------------------------------------------------------------
describe("mapEurouterModel", () => {
  const sampleModel: EurouterModel = {
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
      input_cache_read: "0",
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
    supported_parameters: ["temperature", "top_p", "tools"],
    tags: ["flagship"],
  };

  it("maps id pass-through", () => {
    const result = mapEurouterModel(sampleModel);
    expect(result.id).toBe("gpt-4o");
  });

  it("maps name", () => {
    const result = mapEurouterModel(sampleModel);
    expect(result.name).toBe("GPT-4o");
  });

  it("maps input modalities", () => {
    const result = mapEurouterModel(sampleModel);
    expect(result.input).toEqual(["text", "image"]);
  });

  it("maps cost fields from pricing strings to per-million numbers", () => {
    const result = mapEurouterModel(sampleModel);
    expect(result.cost.input).toBe(2.5);
    expect(result.cost.output).toBe(10);
    expect(result.cost.cacheRead).toBe(0);
    expect(result.cost.cacheWrite).toBe(0);
  });

  it("maps contextWindow", () => {
    const result = mapEurouterModel(sampleModel);
    expect(result.contextWindow).toBe(128000);
  });

  it("maps maxTokens from top_provider", () => {
    const result = mapEurouterModel(sampleModel);
    expect(result.maxTokens).toBe(16384);
  });

  it("defaults maxTokens to 4096 when null", () => {
    const model: EurouterModel = {
      ...sampleModel,
      top_provider: { ...sampleModel.top_provider, max_completion_tokens: null },
    };
    expect(mapEurouterModel(model).maxTokens).toBe(4096);
  });

  it("sets reasoning to false when no reasoning tag or param", () => {
    const result = mapEurouterModel(sampleModel);
    expect(result.reasoning).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Reasoning detection
// ---------------------------------------------------------------------------
describe("reasoning detection", () => {
  const baseModel: EurouterModel = {
    id: "test-model",
    name: "Test",
    context_length: 128000,
    architecture: {
      modality: "text",
      input_modalities: ["text"],
      output_modalities: ["text"],
      tokenizer: null,
      instruct_type: null,
    },
    top_provider: {
      context_length: 128000,
      max_completion_tokens: 8192,
      is_moderated: false,
    },
    supported_parameters: ["temperature"],
  };

  it('detects reasoning from "reasoning" tag', () => {
    const model: EurouterModel = { ...baseModel, tags: ["reasoning", "coding"] };
    expect(mapEurouterModel(model).reasoning).toBe(true);
  });

  it('detects reasoning from "reasoning_effort" supported parameter', () => {
    const model: EurouterModel = {
      ...baseModel,
      supported_parameters: ["reasoning_effort", "tools"],
    };
    expect(mapEurouterModel(model).reasoning).toBe(true);
  });

  it("returns false when no reasoning signals", () => {
    const model: EurouterModel = { ...baseModel, tags: ["coding", "math"] };
    expect(mapEurouterModel(model).reasoning).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. API key validation
// ---------------------------------------------------------------------------
describe("validateApiKey", () => {
  it('accepts keys starting with "eur_"', () => {
    expect(validateApiKey("eur_abc123")).toBe(true);
  });

  it("rejects keys without the eur_ prefix", () => {
    expect(validateApiKey("sk-abc123")).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(validateApiKey("")).toBe(false);
  });

  it("rejects undefined", () => {
    expect(validateApiKey(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. fetchAllModels + resolveDynamicModel
// ---------------------------------------------------------------------------
describe("fetchAllModels", () => {
  const BASE_URL = "https://api.eurouter.ai/api/v1";

  const mockModels: EurouterModel[] = [
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
        input_cache_read: "0",
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
    {
      id: "deepseek-r1",
      name: "DeepSeek R1",
      context_length: 163840,
      pricing: {
        prompt: "0.00000066",
        completion: "0.0000026",
        request: "0",
        image: "0",
        image_token: "0",
        image_output: "0",
        audio: "0",
        input_audio_cache: "0",
        web_search: "0",
        internal_reasoning: "0",
        input_cache_read: "0",
        input_cache_write: "0",
        discount: 1,
      },
      architecture: {
        modality: "text->text",
        input_modalities: ["text"],
        output_modalities: ["text"],
        tokenizer: "DeepSeek",
        instruct_type: null,
      },
      top_provider: {
        context_length: 163840,
        max_completion_tokens: null,
        is_moderated: false,
      },
      supported_parameters: ["temperature", "top_p"],
      tags: ["reasoning", "open-source"],
    },
  ];

  beforeEach(() => {
    clearModelCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockModels }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and returns all models mapped to OpenClaw format", async () => {
    const models = await fetchAllModels(BASE_URL);
    expect(models).toHaveLength(2);
    expect(models[0].id).toBe("gpt-4o");
    expect(models[1].id).toBe("deepseek-r1");
  });

  it("correctly maps pricing", async () => {
    const models = await fetchAllModels(BASE_URL);
    expect(models[0].cost.input).toBe(2.5);
    expect(models[0].cost.output).toBe(10);
  });

  it("detects reasoning models via tags", async () => {
    const models = await fetchAllModels(BASE_URL);
    expect(models[0].reasoning).toBe(false); // gpt-4o
    expect(models[1].reasoning).toBe(true); // deepseek-r1
  });

  it("calls the correct endpoint", async () => {
    await fetchAllModels(BASE_URL);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.eurouter.ai/api/v1/models",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("caches responses (does not re-fetch within TTL)", async () => {
    await fetchAllModels(BASE_URL);
    await fetchAllModels(BASE_URL);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("returns empty array on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network error"))
    );
    const models = await fetchAllModels(BASE_URL);
    expect(models).toEqual([]);
  });
});

describe("resolveDynamicModel", () => {
  const BASE_URL = "https://api.eurouter.ai/api/v1";

  beforeEach(() => {
    clearModelCache();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: [
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
                  input_cache_read: "0",
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
                supported_parameters: ["temperature"],
                tags: [],
              },
            ],
          }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves a known model by id", async () => {
    const result = await resolveDynamicModel(BASE_URL, "gpt-4o");
    expect(result).toBeDefined();
    expect(result!.id).toBe("gpt-4o");
    expect(result!.cost.input).toBe(2.5);
  });

  it("returns undefined for an unknown model id", async () => {
    const result = await resolveDynamicModel(BASE_URL, "nonexistent");
    expect(result).toBeUndefined();
  });
});
