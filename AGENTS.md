# Agent guide for the OpenWork MCP App examples

This is a public, forkable monorepo of independently authored standard MCP Apps. Agents may add examples, change interfaces, fixtures, and native tools while preserving the protocol and security boundaries below.

## Start and verify

```bash
pnpm install
pnpm dev
pnpm start:mcp
pnpm verify
```

- `pnpm dev` builds every App and opens the multi-App local host at `http://localhost:5173/`.
- `pnpm start:mcp` exposes the real stateless Streamable HTTP server at `http://127.0.0.1:8787/mcp`.
- `pnpm verify` type-checks, builds all self-contained resources, enforces portability/size limits, and tests tools, resources, UI metadata, gateway calls, and result fields.

## Editing surfaces

- Add or change an App in `apps/<example>/src`.
- Share handshake/tool-call logic through `packages/mcp-app-runtime`.
- Share UI elements through `packages/example-ui`.
- Change deterministic local/server data in `fixtures/mock-data.json`.
- Change browser-host behavior in `playground`.
- Change the standard MCP server in `scripts/mcp-server.mjs`.
- Add generated targets in `scripts/build-examples.mjs`.
- Never hand-edit `docs`; regenerate it with `pnpm build` and commit source and output together.

## Contract invariants

1. Expose ordinary MCP tools and resources. Do not add an OpenWork-specific HTML manifest, iframe protocol, or wrapper-tool protocol.
2. Every launch tool attaches one exact resource through `_meta.ui.resourceUri`; each `ui://` URI must be immutable/versioned and readable as `text/html;profile=mcp-app`.
3. Apps call only app-visible tools on the MCP server that served their UI.
4. For OpenWork URL imports, read the exact capability-search and execution tool names from launch `structuredContent.serverTools`; never guess them or embed an installation ID.
5. Search and execution use ordinary MCP `tools/call` and results. Programs remain server-side durable resources; do not reintroduce per-App `run_program_*` tools.
6. Preserve authorization, annotations, confirmation requirements, and audit behavior. The UI must never receive credentials or directly contact unrelated MCP servers.
7. React and Vite are authoring choices. The compiled HTML is the runtime MCP App resource; do not call this React SSR.
8. Fixture records, credentials, connection IDs, and provider secrets must never enter a compiled resource.
9. A static URL App must remain useful in launch-only mode or clearly explain that its gateway is unavailable.
10. Keep OpenWork-generated UI authoring separate. This repo demonstrates external authoring, native MCP Apps, URL import, and capability use—not source submission to OpenWork.

## Agent acceptance check

After a change, run `pnpm verify`, then use `pnpm dev` to confirm all three frames reach **Connected**. Search projects in Project Atlas, search and execute a match in Capability Explorer, and switch through every Component Gallery state. If an MCP contract changes, update the App, server, playground, protocol checks, execution contract, and demo script together.
