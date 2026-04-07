---
name: eurouter-provider
description: "EUrouter provider plugin for OpenClaw. Use when the user wants EU-hosted LLM routing, GDPR-aligned model access, or EU data residency through EUrouter models such as eurouter/gpt-4o or eurouter/claude-sonnet-4-6."
license: MIT
homepage: https://github.com/EUrouter/eurouter-openclaw/tree/main/packages/openclaw-plugin
metadata:
  openclaw:
    emoji: "EU"
    requires:
      env: [EUROUTER_API_KEY]
    primaryEnv: EUROUTER_API_KEY
---

# EUrouter Provider

Use EUrouter as an OpenClaw model provider.

## Setup

Get an API key from [eurouter.ai](https://eurouter.ai), then store it in the
OpenClaw secrets store:

```bash
openclaw secrets set EUROUTER_API_KEY eur_your_key_here
```

On macOS, do not rely on shell exports for gateway credentials. The OpenClaw
gateway runs as a LaunchAgent and does not inherit your interactive shell
environment.

## Models

Once installed, select any EUrouter model by its full provider-prefixed id:

```text
eurouter/gpt-4o
eurouter/claude-sonnet-4-6
eurouter/deepseek-r1
eurouter/mistral-large-3
eurouter/llama-4-maverick
```

The plugin also resolves additional EUrouter models dynamically through the
EUrouter catalog endpoint.

## Security & Permissions

**Requires:** `EUROUTER_API_KEY`

This package uses one provider credential only: your EUrouter API key. Requests
go to EUrouter's OpenAI-compatible API at `https://api.eurouter.ai/api/v1`,
including model discovery and inference requests. The plugin does not request
unrelated secrets or modify other plugins' configuration.

If you use `agents.defaults.models`, keep that allowlist in place and add either
`eurouter/*` or the specific EUrouter model ids you want to allow.
