# OpenWork Remote MCP App execution contract

Project Atlas is an open-source, forkable authoring workspace for a portable OpenWork Remote MCP App. Build it with Vite, React, another framework, or your own coding agent; the deployable result is one self-contained HTML document that speaks the stable MCP Apps protocol.

The repository includes a real local MCP Apps host, deterministic mock OpenWork Connect data, two immutable compiled revisions, and automated contract checks. No OpenWork checkout, account, provider credential, or cloud environment is required for the local development loop.

## Start locally

Requires Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

Vite opens `http://localhost:5173/playground.html`. The playground:

- embeds the same app that becomes the portable artifact;
- performs the official MCP Apps `postMessage` initialize/initialized handshake;
- sends the launch contract through tool-result `structuredContent`;
- exposes the generated proxy tool name that OpenWork would create; and
- answers `tools/call` with editable data from `src/mock-data.ts`.

Search for `migration` in the app and inspect the adjacent host event log. That round trip is the local execution contract, not a UI-only mock.

## Iterate with your own agent

Give a coding agent this repository and ask it to change the React experience, the mock project data, or the declared capability. [`AGENTS.md`](AGENTS.md) defines the invariants it must preserve.

The main authoring surfaces are:

| Surface | Purpose |
| --- | --- |
| `src/main.tsx` | The portable app UI and MCP Apps client |
| `src/mock-data.ts` | Deterministic provider data used only by the local host |
| `src/playground.ts` | Local MCP Apps host and mock Connect execution |
| `index.html` | Embedded OpenWork import manifest |
| `docs/index.html` | Generated installable revision `1.0.0` |
| `docs/v2/index.html` | Generated installable revision `2.0.0` |

Run the complete local gate before publishing:

```bash
pnpm verify
```

It type-checks the authoring and host code, rebuilds both immutable documents, and verifies the manifest, capability declaration, absence of external runtime dependencies, separation from mock data, and OpenWork's 768 KiB resource limit.

## The execution contract

The source repository is intentionally flexible. The imported artifact is intentionally narrow:

1. A public HTTPS URL returns a complete HTML document.
2. The document contains an `openwork.remote-mcp-app/1` manifest.
3. All JavaScript, styles, framework code, and the MCP Apps client are self-contained.
4. The app initializes through the MCP Apps host and receives launch-time data through tool `structuredContent`.
5. The app calls only generated proxy tool names supplied by the host.
6. OpenWork Connect connections, real tool names, user data, and credentials remain outside the bundle.
7. OpenWork downloads and validates the URL, stores an immutable revision with its digest, and executes from its cached copy rather than depending on the source URL at runtime.

React is only this repository's authoring implementation. OpenWork does not clone this repository, run Vite, or treat React source as the runtime protocol. See [`EXECUTION_CONTRACT.md`](EXECUTION_CONTRACT.md) for the complete boundary.

## Publish and import into OpenWork

This repository publishes its generated `docs/` directory with GitHub Pages. The current install URL is:

```text
https://reachjalil.github.io/openwork-remote-mcp-app-example/index.html
```

The clean path from local code to OpenWork is:

1. Run `pnpm verify` and commit the generated HTML.
2. Publish that HTML at a stable public HTTPS URL, such as GitHub Pages.
3. In an OpenWork build with Remote MCP Apps enabled, add the URL to the Library.
4. Review the fetched manifest and map **Project search** to an OpenWork Connect server exposing a read-only `search_projects` tool.
5. Activate the imported revision.
6. OpenWork agents discover the generated launch and proxy tools through their normal MCP provider connection. The Desktop MCP Apps host renders the cached UI and passes it only the scoped capability mapping.

Cloud-side agent execution uses OpenWork's stored app definition and Connect-backed proxy tools; it does not execute this repository, expose provider credentials to the app, or make the cached UI depend on GitHub. Import, refresh, and activation remain explicit control-plane actions.

Remote MCP Apps is currently being developed in [OpenWork PR #3758](https://github.com/different-ai/openwork/pull/3758), stacked on the foundational Plugin model in [PR #3759](https://github.com/different-ai/openwork/pull/3759). Availability therefore depends on the OpenWork build and feature flags in use.

## Immutable revision fixtures

- `docs/index.html` is revision `1.0.0`.
- `docs/v2/index.html` is revision `2.0.0` for refresh, preview, activation, retirement, and rollback testing.
- Both files are generated from the same source and contain no credentials or external runtime assets.

## License

MIT. Fork it, replace Project Atlas with your own app, and keep the execution boundary intact.
