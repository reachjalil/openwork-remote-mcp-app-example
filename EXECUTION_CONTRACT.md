# MCP App execution contract

This repository demonstrates independently authored MCP App UIs with two standards-based distribution paths: a normal MCP server, or an immutable HTTPS URL import served by OpenWork.

## 1. Authoring and build

Authors may use Vite, React, another framework, or no framework; work with any coding agent; replace the examples and tools; and deploy to any suitable host. OpenWork never needs the source repository. The deployable boundaries are either a standard MCP endpoint or one compiled, self-contained HTML document.

React source is an authoring input compiled during this project's build. The generated HTML is the runtime MCP App resource. The build does not produce pre-rendered React markup, so this is not React SSR.

## 2. Native MCP server

`scripts/mcp-server.mjs` is an ordinary stateless Streamable HTTP MCP server. It advertises the stable MCP Apps extension, registers native tools and resources, and returns normal MCP results.

Each `open_*` tool references one exact, versioned `ui://` URI through `_meta.ui.resourceUri`. `resources/read` returns that URI as `text/html;profile=mcp-app`. App-visible `search_capabilities`, `execute_capability`, and `search_projects` tools stay on the same server; there is no custom iframe message or cross-server tool call.

```text
Agent -> tools/call(open_project_atlas)
Host  -> resources/read(ui://openwork-examples/project-atlas/1.0.0/index.html)
Host  -> sandboxed iframe + MCP Apps handshake + launch structuredContent
App   -> tools/call(search_capabilities) on the same MCP server
App   -> tools/call(execute_capability) on the same MCP server
```

The search/execution pair in this repository is deterministic example behavior. In OpenWork, those same ordinary MCP calls gateway the current user's authorized Connect tools and durable Code Mode Programs.

## 3. Self-contained resource

Each generated App is a complete HTML document under 768 KiB. Scripts, styles, React, and the MCP Apps client are inlined. The document does not load application code, fonts, images, or stylesheets from the network.

The compiled resources contain presentation and protocol logic, but no fixture records, OpenWork IDs, connection IDs, tokens, API keys, cookies, or provider credentials. Launch data and execution results arrive through tool-result `structuredContent`; human-readable summaries remain in `content`; provider/host metadata remains in `_meta`.

`fixtures/mock-data.json` is loaded by the local host and example MCP server, not by any compiled App.

## 4. Browser host

The local playground implements a compatible host for iteration. It creates one isolated MCP Apps bridge per iframe, completes `ui/initialize`, sends each launch result, handles app tool calls, accepts size notifications, and records visible protocol events. It does not imitate OpenWork-specific runtime messages.

OpenWork Desktop provides the production host boundary: sandboxed iframe loading, isolated handshakes, CSP enforcement, resource-size checks, teardown, and error recovery.

## 5. OpenWork Connect and native Apps

When this or another MCP endpoint is added through Connect, OpenWork exposes only ready, authorized connections. It preserves native names, schemas, annotations, UI metadata, resources, content, `structuredContent`, `_meta`, and safe provider errors.

A native MCP App calls app-visible tools only on the server that supplied its resource. OpenWork policy may deny a call, and write/destructive tools retain confirmation requirements. Credentials stay in the server-side connection.

## 6. URL-import adapter

An agent may ask OpenWork Connect to install a public HTTPS URL that resolves to one self-contained `index.html`. Installation requires user approval. OpenWork downloads the bytes server-side with redirect, network, MIME, timeout, and size validation; computes a digest; caches the exact bytes; and publishes an immutable revision through an ordinary launch tool and versioned `ui://` resource.

The host never iframes or executes the live source URL. A later source change or outage does not mutate the cached revision. Updating creates a new revision that can be activated, retired, or rolled back independently.

OpenWork supplies the imported App's app-visible gateway names in launch `structuredContent`. The App uses `search_capabilities` to discover allowed Connect tools and Programs and `execute_capability` to execute an exact selected match. Both are ordinary same-server MCP calls. OpenWork resolves the underlying capability server-side and preserves its authorization, schema, confirmation, and audit behavior.

This is installation/gateway behavior, not a new MCP protocol primitive. The iframe never receives credentials or calls unrelated MCP endpoints directly.

## 7. Capability boundaries

- Agents may import a remote self-contained App URL when a user approves installation.
- Sandboxed Apps cannot invoke the model-visible import tool.
- Imported Apps may use only the app-visible gateway names explicitly supplied by their launch result.
- Programs remain durable server-side resources and may compose authorized Connect capabilities.
- OpenWork-generated UI authoring, React source submission, compilation, publication, and revision tools remain separate and may be disabled while imported/native Apps and Programs remain enabled.
- A host that supplies no gateway still renders a launch-only App. The Component Gallery is the reference for this mode.

## 8. Verification

`pnpm verify` proves:

- all TypeScript authoring code compiles;
- all generated UIs are complete, self-contained, and below 768 KiB;
- fixture records and sensitive-looking values do not enter the resources;
- all launch tools reference exact versioned resources;
- all resources read with the MCP App MIME type;
- launch results deliver exact gateway names through `structuredContent`;
- app-visible capability search and execution return ordinary MCP results; and
- a native same-server tool still returns structured data.
