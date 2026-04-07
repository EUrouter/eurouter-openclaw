/**
 * Onboarding helper for EUrouter provider configuration.
 */

import { DEFAULT_BASE_URL } from "./index.js";

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
