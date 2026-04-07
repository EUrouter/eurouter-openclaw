# @eurouter/openclaw-eurouter

OpenClaw provider plugin for [EUrouter](https://eurouter.ai) — EU-hosted, GDPR-compliant LLM routing.

## Installation

```bash
openclaw plugins install @eurouter/openclaw-eurouter
```

## Configuration

Set your EUrouter API key as an environment variable:

```bash
export EUROUTER_API_KEY=eur_your_key_here
```

Get your API key at [eurouter.ai](https://eurouter.ai).

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
