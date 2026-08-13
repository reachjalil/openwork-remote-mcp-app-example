# Agent guide for Project Atlas

Project Atlas is an open-source, forkable standard MCP App. Agents may change the UI, mock data, and native MCP tools while preserving the protocol boundary below.

## Start and verify

```bash
pnpm install
pnpm dev
pnpm start:mcp
pnpm verify
```

- `pnpm dev` opens `playground.html`, a deterministic browser host for fast UI iteration.
- `pnpm start:mcp` exposes a real stateless Streamable HTTP MCP server at `http://127.0.0.1:8787/mcp`.
- `pnpm verify` builds the self-contained UI resource and tests the server's tools, resource, UI metadata, results, and size limits.

## Safe editing surfaces

- Change the app in `src/main.tsx` and `src/styles.css`.
- Change deterministic local/server data in `src/mock-data.json`.
- Change browser-host behavior in `src/playground.ts`.
- Change the standard MCP server in `scripts/mcp-server.mjs`.
- Rebuild `docs/index.html` and `docs/v2/index.html` with `pnpm build`; do not hand-edit generated files.

## Contract invariants

1. The server exposes ordinary MCP tools and resources. Do not add an OpenWork-specific runtime manifest or wrapper-tool protocol.
2. `open_project_atlas` attaches the UI through exact `_meta.ui.resourceUri` metadata.
3. `ui://project-atlas/view.html` is returned as `text/html;profile=mcp-app` and is self-contained and under 768 KiB.
4. The app calls the native `search_projects` tool on the same MCP server that served its UI.
5. Launch and search data arrive through standard tool-result `structuredContent`; content and `_meta` remain standard MCP result fields.
6. React and Vite are authoring choices. The compiled HTML is the MCP App resource; this is not React SSR.
7. Mock records, credentials, connection IDs, and provider secrets must never enter the compiled UI resource.
8. The GitHub Pages URL is a static-resource example. Tool-backed operation requires the standard MCP server to be reachable through OpenWork Connect or another compatible MCP host.

## Agent acceptance check

After a change, run `pnpm verify`, use `pnpm dev` to confirm the playground reaches **Connected**, and call Project search once. If the MCP contract changes, update the app, server, browser playground, checks, and docs together.
