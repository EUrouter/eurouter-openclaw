import { describe, it, expect } from "vitest";
import {
  PROVIDER_ID,
  DEFAULT_BASE_URL,
  ATTRIBUTION_HEADERS,
  TRANSPORT_API,
} from "../src/index.js";

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
