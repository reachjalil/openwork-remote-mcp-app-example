# OpenWork Remote MCP App example

Project Atlas is a small Vite/React app packaged as one self-contained HTML file for OpenWork's Remote MCP Apps Library.

Install this URL in an OpenWork build with Remote MCP Apps enabled:

```text
https://reachjalil.github.io/openwork-remote-mcp-app-example/index.html
```

The app declares one required, read-only OpenWork Connect capability named **Project search**. During import, map it to a connection whose MCP server exposes a read-only `search_projects` tool. OpenWork keeps the connection and credentials outside the UI bundle and gives the running app only the generated proxy tool name in launch-time `structuredContent`.

## Portable bundle

- `docs/index.html` is revision `1.0.0`.
- `docs/v2/index.html` is revision `2.0.0` for refresh/activation testing.
- Each file embeds the `openwork.remote-mcp-app/1` manifest.
- JavaScript, React, styles, and the MCP Apps client are all inlined by Vite.
- The published HTML contains no external runtime dependencies or credentials.

## Build and verify

```bash
pnpm install
pnpm verify
```

The verification script checks both compiled documents, their manifest versions, the absence of external script/style references, and OpenWork's 768 KiB resource limit.
