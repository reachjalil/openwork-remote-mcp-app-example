# Project Atlas: a standard MCP App you can fork

Project Atlas is a complete open-source MCP App development repository. It includes a Vite + React UI, a real Streamable HTTP MCP server, deterministic mock data, a browser playground, a self-contained published resource, and protocol-level checks.

You can clone it, give it to your own coding agent, change the interface or tools, test everything locally, and then choose either distribution path: deploy its standard MCP server through OpenWork Connect, or publish the self-contained UI and import that URL into an OpenWork Plugin with a Code Mode Program. There is no OpenWork-specific runtime manifest in the HTML.

## Run the complete local loop

Requires Node.js 20+ and pnpm.

```bash
pnpm install
pnpm verify
pnpm dev
```

Vite opens `http://localhost:5173/playground.html`. The playground embeds the app, performs the MCP Apps `postMessage` handshake, delivers launch data in tool-result `structuredContent`, and simulates OpenWork's app-specific Program tool with records from `src/mock-data.json`. The separate real MCP server exercises the native `search_projects` fallback.

In another terminal, run the real MCP server:

```bash
pnpm start:mcp
# http://127.0.0.1:8787/mcp
```

That endpoint is a stateless Streamable HTTP MCP server. It advertises:

- `open_project_atlas`, with `_meta.ui.resourceUri` set to `ui://project-atlas/view.html`;
- `search_projects`, an app-visible native read-only tool;
- the exact `ui://project-atlas/view.html` resource as `text/html;profile=mcp-app`; and
- the stable `io.modelcontextprotocol/ui` extension.

`pnpm check:mcp` connects through the official SDK and verifies the tool definitions, exact resource URI, MIME type, UI metadata, `structuredContent`, and result `_meta`.

## Build with your own agent

[`AGENTS.md`](AGENTS.md) gives coding agents the repository contract. The main surfaces are:

| Surface | Purpose |
| --- | --- |
| `src/main.tsx` | React-authored MCP App UI |
| `src/mock-data.json` | Deterministic data shared by the browser playground and MCP server |
| `src/playground.ts` | Local browser MCP Apps host |
| `scripts/mcp-server.mjs` | Standard Streamable HTTP MCP server |
| `scripts/check-mcp-server.mjs` | Protocol-level contract check |
| `docs/index.html` | Published self-contained UI resource |
| `docs/v2/index.html` | Second immutable resource for cache/lifecycle testing |

React is only the authoring implementation. Vite compiles it into one self-contained client document. The server returns that immutable document as the MCP App resource; OpenWork does not run this repository, Vite, or React source at render time, and this is not React SSR.

## Add it to OpenWork

### Full tool-backed MCP App through Connect

1. Deploy this repository's Node server to a public HTTPS service.
2. Ensure its Streamable HTTP endpoint is available at `/mcp`.
3. Add that endpoint as a normal server in OpenWork Connect.
4. Grant the appropriate organization, team, or member access in Connect.
5. OpenWork agents discover the server's native tools. Calling `open_project_atlas` renders the attached resource; the app's `search_projects` call stays on that same server.

OpenWork may proxy an authorized Connect server on an OpenWork-owned URL, but it preserves the MCP server's native tool names, schemas, resource URIs, UI metadata, content, `structuredContent`, and `_meta`. Provider credentials stay server-side.

### Static URL adapter

GitHub Pages publishes the generated document at:

```text
https://reachjalil.github.io/openwork-remote-mcp-app-example/index.html
```

An OpenWork build with the URL-import adapter can download that document into the Library, validate it, digest it, and serve it later as an immutable standard MCP App resource. The cached copy no longer depends on GitHub at runtime.

The Pages URL is deliberately static, so it cannot host `search_projects` itself. When OpenWork imports it, the launch result advertises an app-specific, app-visible Program tool on the same OpenWork MCP server. Add a Code Mode Program to the app's Plugin and select it; the UI calls the advertised tool with standard `tools/call`, and the Program can compose the user's OpenWork Connect capabilities server-side. Credentials and connection IDs never enter the HTML.

The bundle falls back to its native `search_projects` tool when it is rendered by this repository's own MCP server. It uses the Program tool only when the launch result explicitly supplies that tool name.

## Execution boundary

The standard flow is:

```text
Agent -> tools/list -> open_project_atlas (_meta.ui.resourceUri)
Agent -> tools/call -> content + structuredContent + _meta
Host  -> resources/read(ui://project-atlas/view.html)
Host  -> sandboxed MCP App iframe
App   -> tools/call(search_projects) on the same MCP server
```

For the URL-import path, the final line becomes:

```text
App     -> tools/call(run_program_<app>) on the same OpenWork MCP server
Program -> connected MCP capabilities inside OpenWork Connect
```

The UI bundle contains presentation logic and a native fallback tool name. An imported app reads its exact Program tool name from launch `structuredContent`; it does not guess or embed an OpenWork installation identifier. The bundle contains no credentials, OpenWork connection IDs, or mock records. Data arrives at render time from standard MCP tool results.

See [`EXECUTION_CONTRACT.md`](EXECUTION_CONTRACT.md) for the full boundary. The OpenWork integration is developed in [OpenWork PR #3758](https://github.com/different-ai/openwork/pull/3758), on top of the merged Plugin foundation from [PR #3759](https://github.com/different-ai/openwork/pull/3759).

## License

MIT. Fork it, replace Project Atlas, keep the MCP contract standard, and publish your own server and UI resource.
