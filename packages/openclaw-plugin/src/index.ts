/**
 * EUrouter provider plugin for OpenClaw.
 *
 * Registers EUrouter as an OpenAI-compatible LLM provider with
 * EU data residency and GDPR compliance.
 */

import {
  fetchAllModels,
  resolveDynamicModel,
  stripProviderPrefix,
} from "./provider-catalog.js";
import { STATIC_MODELS } from "./static-models.js";

// ---------------------------------------------------------------------------
// Constants (exported for testing)
// ---------------------------------------------------------------------------

export const PROVIDER_ID = "eurouter";
export const DEFAULT_BASE_URL = "https://api.eurouter.ai/api/v1";
export const TRANSPORT_API = "openai-completions";

export const ATTRIBUTION_HEADERS: Record<string, string> = {
  "HTTP-Referer": "https://openclaw.ai",
  "X-EUrouter-Title": "OpenClaw",
  "X-EUrouter-Categories": "cli-agent",
};

// ---------------------------------------------------------------------------
// Plugin entry
// ---------------------------------------------------------------------------

export default {
  id: PROVIDER_ID,
  name: "EUrouter",
  description: "EU-hosted, GDPR-compliant LLM routing via EUrouter",

  register(api: any) {
    api.registerProvider({
      id: PROVIDER_ID,
      label: "EUrouter",
      envVars: ["EUROUTER_API_KEY"],
      auth: [
        {
          id: "api-key",
          kind: "api_key",
          label: "EUrouter API Key",
          hint: "API key (starts with eur_)",
        },
      ],
      catalog: {
        order: "simple" as const,
        run: async (ctx: any) => {
          const apiKey = ctx.resolveProviderApiKey(PROVIDER_ID)?.apiKey;
          if (!apiKey) return null;

          const config = ctx.pluginConfig ?? {};
          const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
          const liveModels = await fetchAllModels(baseUrl);
          const models = (liveModels.length > 0 ? liveModels : STATIC_MODELS)
            .map((m) => ({
              ...m,
              input: m.input.filter((i) => i === "text" || i === "image"),
              headers: ATTRIBUTION_HEADERS,
            }))
            .filter((m) => m.input.length > 0);

          return {
            provider: { baseUrl, apiKey, api: TRANSPORT_API, models },
          };
        },
      },

      resolveDynamicModel: async (ctx: any) => {
        const bareId = stripProviderPrefix(ctx.modelId);
        const resolved = await resolveDynamicModel(DEFAULT_BASE_URL, bareId);

        if (resolved) {
          return {
            ...resolved,
            id: ctx.modelId,
            provider: PROVIDER_ID,
            api: TRANSPORT_API,
            baseUrl: DEFAULT_BASE_URL,
            headers: ATTRIBUTION_HEADERS,
          };
        }

        // Fallback stub for models not yet in the catalog
        return {
          id: ctx.modelId,
          name: ctx.modelId,
          provider: PROVIDER_ID,
          api: TRANSPORT_API,
          baseUrl: DEFAULT_BASE_URL,
          reasoning: false,
          input: ["text"],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 128_000,
          maxTokens: 8192,
          headers: ATTRIBUTION_HEADERS,
        };
      },

      prepareDynamicModel: async (ctx: any) => {
        const bareId = stripProviderPrefix(ctx.modelId);
        const resolved = await resolveDynamicModel(DEFAULT_BASE_URL, bareId);
        if (!resolved) {
          throw new Error(
            `EUrouter: model "${ctx.modelId}" not found. Check the model ID or verify it is available on EUrouter.`
          );
        }
        ctx.dynamicModelData = { ...resolved, headers: ATTRIBUTION_HEADERS };
      },
    });
  },
};
