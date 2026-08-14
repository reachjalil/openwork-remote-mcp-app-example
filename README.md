# OpenWork MCP App examples

A public, forkable monorepo of standard MCP Apps for testing OpenWork Connect. It contains three Vite + React interfaces, shared MCP Apps runtime helpers, a real Streamable HTTP MCP server, deterministic host-side fixtures, a multi-App browser playground, and protocol-level verification.

Build the Apps outside OpenWork with any coding agent, publish a self-contained `index.html`, and import that URL into an OpenWork Plugin. Or deploy this repository's MCP server and add it through Connect as a normal tool-backed MCP server.

## Published Apps

Each URL is a complete self-contained MCP App resource. It contains no credentials, mock records, or OpenWork-specific runtime manifest.

| Example | What it demonstrates | URL to import |
| --- | --- | --- |
| Project Atlas | Metrics, search, table/detail layout, capability discovery and execution | `https://reachjalil.github.io/openwork-remote-mcp-app-example/project-atlas/index.html` |
| Capability Explorer | Semantic capability search, exact match selection, arguments, and approved execution | `https://reachjalil.github.io/openwork-remote-mcp-app-example/capability-explorer/index.html` |
| Component Gallery | Cards, status chips, loading/empty/error states, responsive table, and timeline | `https://reachjalil.github.io/openwork-remote-mcp-app-example/component-gallery/index.html` |
| Project Atlas revision 2 | A second immutable URL for update, activation, retirement, and rollback tests | `https://reachjalil.github.io/openwork-remote-mcp-app-example/v2/index.html` |

The original Project Atlas URL remains available at `https://reachjalil.github.io/openwork-remote-mcp-app-example/index.html`.

## Run locally

Requires Node.js 20+ and pnpm.

```bash
git clone https://github.com/reachjalil/openwork-remote-mcp-app-example.git
cd openwork-remote-mcp-app-example
pnpm install
pnpm verify
pnpm dev
```

Open `http://localhost:5173/`. The playground embeds all three generated documents, performs the real MCP Apps `postMessage` handshake, delivers ordinary launch `structuredContent`, and handles ordinary same-server `tools/call` requests with deterministic fixtures.

Run one App without the multi-App host while editing:

```bash
pnpm dev:atlas
pnpm dev:capabilities
pnpm dev:gallery
```

Run the standard MCP server in another terminal:

```bash
pnpm start:mcp
# http://127.0.0.1:8787/mcp
```

The endpoint is a stateless Streamable HTTP MCP server with three versioned `ui://` resources, three launch tools bound through exact `_meta.ui.resourceUri`, and app-visible same-server tools. `pnpm check:mcp` connects with the official SDK and verifies resource reads, MIME types, metadata, launch data, capability search, exact execution, and the native Project Atlas tool.

## Monorepo map

| Surface | Purpose |
| --- | --- |
| `apps/project-atlas` | Tool-backed project dashboard |
| `apps/capability-explorer` | Capability-search and execution reference UI |
| `apps/component-gallery` | Reusable interface pattern gallery |
| `packages/mcp-app-runtime` | MCP Apps handshake, launch-result, and same-server tool-call helper |
| `packages/example-ui` | Shared React components and visual tokens |
| `playground` | Deterministic browser host for all generated Apps |
| `fixtures/mock-data.json` | Host/server-only local data; never bundled into the Apps |
| `scripts/mcp-server.mjs` | Standard MCP server exposing all three Apps |
| `scripts/check-mcp-server.mjs` | Protocol-level contract check |
| `docs` | Generated self-contained Pages resources; do not hand-edit |

React is only an authoring choice. Vite compiles each UI into one self-contained client document. That immutable HTML document is the MCP App resource; OpenWork never executes this source tree at render time, and this is not React SSR.

## Use with OpenWork

### Import a published App URL

1. Choose or create an OpenWork Plugin.
2. Ask an agent to import one of the HTTPS URLs above through OpenWork Connect.
3. Review and approve the third-party executable-content installation.
4. Open the cached resource from the Plugin's MCP capabilities.

OpenWork downloads the exact HTML bytes server-side, validates and digests them, and serves the cached immutable revision through a versioned `ui://` resource. It does not execute or iframe the live source URL.

For Apps that need Connect tools or Code Mode Programs, the OpenWork launch result supplies the exact app-visible gateway tool names in ordinary `structuredContent`:

```json
{
  "serverTools": {
    "searchCapabilities": "search_capabilities",
    "executeCapability": "execute_capability"
  }
}
```

The App searches by intent, selects an exact capability (and schema digest when present), then executes it with ordinary same-server MCP `tools/call`. OpenWork mediates the underlying Connect tool or durable Program, preserving authorization, confirmation, and audit behavior. The sandboxed iframe receives no provider credentials and does not contact unrelated MCP servers directly. `codemodeScripts` policy can control Program availability without enabling OpenWork-generated UI authoring.

The Component Gallery is deliberately launch-data-only, so it is useful even when capability search is unavailable. Project Atlas and Capability Explorer surface a clear disconnected state until a compatible host supplies gateway names.

### Add the native MCP server through Connect

1. Deploy `pnpm start:mcp` to a public HTTPS Node service, or expose the local port with a temporary HTTPS tunnel.
2. Add its `/mcp` URL through OpenWork Connect.
3. Grant the desired member/team access.
4. Ask the agent to call `open_project_atlas`, `open_capability_explorer`, or `open_component_gallery`.

This path requires no conversion. OpenWork discovers each tool's `_meta.ui.resourceUri`, reads its `ui://` resource from the originating server, and lets the sandboxed App call that server's app-visible tools through the standard host bridge.

## Demo it

[`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) contains a prepared 7–10 minute product demo, exact agent prompts, local and Connect setup, the native and URL-import paths, expected proof points, and fallbacks.

The OpenWork implementation is tracked in [PR #3782](https://github.com/different-ai/openwork/pull/3782), stacked on the merged Plugin foundation. This repository intentionally demonstrates standard MCP concepts; URL downloading and semantic capability search are OpenWork installation/gateway behavior, not new MCP protocol primitives.

See [`EXECUTION_CONTRACT.md`](EXECUTION_CONTRACT.md) for the runtime and security boundary and [`CONTRIBUTING.md`](CONTRIBUTING.md) for the verification loop.

## License

MIT. Fork the repo, replace the examples, keep the MCP contracts standard, and publish your own resources or server.
