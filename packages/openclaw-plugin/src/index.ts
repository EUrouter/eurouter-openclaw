/**
 * EUrouter provider plugin for OpenClaw.
 *
 * Registers EUrouter as an OpenAI-compatible LLM provider with
 * EU data residency and GDPR compliance.
 */

import { resolveDynamicModel } from "./provider-catalog.js";
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
        run: (ctx: any) => {
          const apiKey = ctx.resolveProviderApiKey(PROVIDER_ID)?.apiKey;
          if (!apiKey) return null;

          return {
            provider: {
              baseUrl: DEFAULT_BASE_URL,
              apiKey,
              api: TRANSPORT_API,
              models: STATIC_MODELS.map((m) => ({
                ...m,
                input: m.input.filter((i) => i === "text" || i === "image"),
                headers: ATTRIBUTION_HEADERS,
              })).filter((m) => m.input.length > 0),
            },
          };
        },
      },

      resolveDynamicModel: (ctx: any) => ({
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
      }),

      prepareDynamicModel: async (ctx: any) => {
        const resolved = await resolveDynamicModel(
          DEFAULT_BASE_URL,
          ctx.modelId
        );
        if (resolved) {
          ctx.dynamicModelData = resolved;
        }
      },
    });
  },
};
