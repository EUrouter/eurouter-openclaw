/**
 * Public API barrel for @eurouter/openclaw-eurouter.
 */

export {
  toPerMillion,
  mapEurouterModel,
  validateApiKey,
  fetchAllModels,
  resolveDynamicModel,
  clearModelCache,
  type EurouterModel,
  type OpenClawModel,
} from "./provider-catalog.js";

export {
  PROVIDER_ID,
  DEFAULT_BASE_URL,
  TRANSPORT_API,
  ATTRIBUTION_HEADERS,
} from "./index.js";
