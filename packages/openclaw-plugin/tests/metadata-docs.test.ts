import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function readText(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("published metadata", () => {
  it("uses documented auth metadata in the plugin manifest", () => {
    const manifest = JSON.parse(readText("../openclaw.plugin.json"));

    expect(manifest.providerAuthEnvVars).toEqual({
      eurouter: ["EUROUTER_API_KEY"],
    });
    expect(manifest.providerAuthChoices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "eurouter",
          method: "api-key",
          choiceId: "eurouter-api-key",
          groupHint: "API key",
          cliFlag: "--eurouter-api-key",
        }),
      ])
    );
    expect(manifest).not.toHaveProperty("requiredEnvVars");
    expect(manifest).not.toHaveProperty("primaryCredential");
  });

  it("keeps package metadata free of unsupported credential fields", () => {
    const pkg = JSON.parse(readText("../package.json"));

    expect(pkg.displayName).toBe("EUrouter");
    expect(pkg.homepage).toBe(
      "https://github.com/EUrouter/eurouter-openclaw/tree/main/packages/openclaw-plugin"
    );
    expect(pkg.openclaw.providers).toEqual(["eurouter"]);
    expect(pkg.openclaw.compat).toEqual({
      pluginApi: ">=2026.3.24-beta.2",
      minGatewayVersion: "2026.3.24-beta.2",
    });
    expect(pkg.openclaw.build).toEqual({
      openclawVersion: "2026.3.24-beta.2",
      pluginSdkVersion: "2026.3.24-beta.2",
    });
    expect(pkg.openclaw).not.toHaveProperty("requiredEnvVars");
    expect(pkg.openclaw).not.toHaveProperty("primaryCredential");
  });

  it("ships a publish-time SKILL.md that declares the required credential", () => {
    const skill = readText("../SKILL.md");

    expect(skill).toContain("env: [EUROUTER_API_KEY]");
    expect(skill).toContain("primaryEnv: EUROUTER_API_KEY");
    expect(skill).toContain("openclaw secrets set EUROUTER_API_KEY");
    expect(skill).toContain("https://api.eurouter.ai/api/v1");
  });

  it("keeps ClawHub publishes limited to runtime-facing files", () => {
    const ignore = readText("../.clawhubignore");

    expect(ignore).toContain("src/");
    expect(ignore).toContain("tests/");
    expect(ignore).toContain("scripts/");
    expect(ignore).toContain("package-lock.json");
    expect(ignore).toContain("*.tgz");
  });
});

describe("security-facing documentation", () => {
  it("tells users to store the API key with OpenClaw secrets", () => {
    const packageReadme = readText("../README.md");
    const rootReadme = readText("../../../README.md");

    expect(packageReadme).toContain(
      "openclaw secrets set EUROUTER_API_KEY eur_your_key_here"
    );
    expect(rootReadme).toContain(
      "openclaw secrets set EUROUTER_API_KEY eur_your_key_here"
    );
    expect(rootReadme).not.toContain("export EUROUTER_API_KEY=");
  });

  it("preserves allowlists instead of advising their removal", () => {
    const packageReadme = readText("../README.md");

    expect(packageReadme).toContain(
      "Keep that allowlist in place and add either `eurouter/*` or the exact EUrouter models you want to permit."
    );
    expect(packageReadme).not.toContain("remove the `agents.defaults.models` key");
  });
});
