# EUrouter OpenClaw Provider Plugin

OpenClaw community plugin that adds [EUrouter](https://eurouter.ai) as an LLM provider — EU-hosted, GDPR-compliant LLM routing.

## Getting started

Install the plugin in OpenClaw:

```bash
openclaw plugins install @eurouter/openclaw-eurouter
```

Set your API key:

```bash
export EUROUTER_API_KEY=eur_your_key_here
```

Then use any EUrouter model in OpenClaw (e.g. `eurouter/gpt-4o`, `eurouter/claude-sonnet-4-6`).

## Development

```bash
cd packages/openclaw-plugin
npm install
npm test          # run tests
npm run typecheck # type-check without emitting
npm run build     # compile to dist/
```

## Publishing to ClawHub

```bash
clawhub package publish eurouter/openclaw-eurouter
```

See [`packages/openclaw-plugin/README.md`](packages/openclaw-plugin/README.md) for full plugin documentation.
