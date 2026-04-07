# @eurouter/openclaw-eurouter

OpenClaw provider plugin for [EUrouter](https://eurouter.ai) — EU-hosted, GDPR-compliant LLM routing.

## Installation

```bash
openclaw plugins install @eurouter/openclaw-eurouter
```

## Configuration

This plugin requires one credential: `EUROUTER_API_KEY`.

Get your API key at [eurouter.ai](https://eurouter.ai), then configure it using the OpenClaw secrets store:

```bash
openclaw secrets set EUROUTER_API_KEY eur_your_key_here
```

> **Note:** On macOS, the OpenClaw gateway runs as a LaunchAgent (background service) and does not inherit shell environment variables. Using `export EUROUTER_API_KEY=...` in your shell profile will **not** work. Always use `openclaw secrets set` or add the key to your `auth-profiles.json`.

## Usage

Once installed, EUrouter models appear in your model picker. Use them like any other provider:

```
eurouter/gpt-4o
eurouter/claude-sonnet-4-6
eurouter/deepseek-r1
eurouter/mistral-large-3
eurouter/llama-4-maverick
```

All requests are routed through EUrouter's EU-based infrastructure, ensuring GDPR compliance and EU data residency.

## Included models

The plugin ships with 98 chat models from OpenAI, Anthropic, Mistral, Meta, DeepSeek, Google, Qwen, and more. Any model available on EUrouter can also be used by specifying its full ID — the plugin dynamically resolves models not in the static catalog.

## Why EUrouter?

- All LLM traffic stays within the EU
- Full GDPR compliance for AI workloads
- OpenAI-compatible API — works with any model
- No vendor lock-in: switch models without code changes

## Troubleshooting

### "model not allowed: eurouter/..."

A fresh OpenClaw install has `agents.defaults.models` set, which acts as an allowlist. Keep that allowlist in place and add either `eurouter/*` or the exact EUrouter models you want to permit.

### Messages silently dropped / model warmup fails

If your configured model is unavailable, the gateway may fail silently during warmup. Check `openclaw logs` for errors. Try switching to a known-working model (e.g. `eurouter/gpt-4o`) to verify your API key and connection.

### API key not working

Verify your key starts with `eur_` and was set via `openclaw secrets set` (not a shell export). Run `openclaw secrets list` to confirm the key is stored.
