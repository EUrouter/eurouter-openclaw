/**
 * Onboarding helper for EUrouter provider configuration.
 */

const DEFAULT_BASE_URL = "https://api.eurouter.ai/api/v1";

export interface EurouterConfig {
  baseUrl?: string;
  [key: string]: unknown;
}

/**
 * Apply EUrouter-specific defaults to a configuration object.
 * Used during OpenClaw's onboarding flow.
 */
export function applyEurouterConfig(config: EurouterConfig): EurouterConfig {
  return {
    ...config,
    baseUrl: config.baseUrl || DEFAULT_BASE_URL,
  };
}
