# Project Atlas execution contract

This repository demonstrates one independently authored, standard MCP server with an MCP App UI.

## 1. Authoring

Authors may use Vite, React, another framework, or no framework; work with any coding agent; replace the sample tools and data; and deploy to any suitable host. OpenWork never needs the source repository. The deployable boundaries are the MCP endpoint and the compiled UI resource.

## 2. Server contract

`scripts/mcp-server.mjs` is an ordinary stateless Streamable HTTP MCP server. It advertises `io.modelcontextprotocol/ui`, registers native tools, and returns normal MCP resources and tool results.

`open_project_atlas` references `ui://project-atlas/view.html` through `_meta.ui.resourceUri`. The resource is returned by exact `resources/read` with MIME type `text/html;profile=mcp-app`. `search_projects` remains a native same-server tool; OpenWork does not rename it or place it behind an app-specific wrapper protocol.

## 3. UI resource contract

The MCP App resource is a complete self-contained HTML document under 768 KiB. Scripts, styles, React, and the MCP Apps client are inlined. It does not load application code, fonts, images, or stylesheets from the network.

React source is an authoring input compiled server-side during the project build. The immutable HTML is the runtime MCP resource. No pre-rendered React markup is produced, so this is not React SSR.

## 4. Runtime contract

```text
MCP App                 Compatible host                  Project Atlas MCP server
   | <--- resource HTML ------ | <--- resources/read --------- |
   | --- ui/initialize ------> |
   | <--- initialize result -- |
   | --- initialized --------> |
   | <--- launch tool result --| <--- content/structuredContent|
   | --- tools/call(search_projects) -------------------------> |
   | <--- content + structuredContent + _meta ---------------- |
```

The browser playground implements the compatible-host column locally. OpenWork Desktop implements it with a sandboxed iframe, isolated handshake, CSP enforcement, resource-size checks, teardown, and recovery.

## 5. Data and credentials

The compiled resource contains only UI code and the native same-server tool name. It does not contain mock project records, OpenWork Connect IDs, tokens, API keys, cookies, or provider credentials. Launch data and search results arrive in tool `structuredContent`; human-readable summaries remain in `content`; provider/host metadata remains in `_meta`.

The mock records in `src/mock-data.json` are loaded by the local host and example MCP server, not by the compiled UI bundle.

## 6. OpenWork Connect

When the public MCP endpoint is added through OpenWork Connect, OpenWork authorizes access per member and exposes that connection as its own standard MCP server endpoint. It preserves native names, input/output schemas, annotations, UI metadata, resources, content, `structuredContent`, `_meta`, and provider errors. Keeping each connection on a separate endpoint preserves tool-name isolation and the MCP Apps same-server boundary.

Apps can call only tools from the MCP server that supplied their resource. OpenWork policy may block a tool, and write-capable tools require host/user approval; neither behavior creates an alternate application protocol.

## 7. Static URL adapter

The generated GitHub Pages document can also be imported as a static Library app. OpenWork downloads it once, validates that it is self-contained, enforces the byte limit, computes a digest, stores immutable source and metadata, and publishes it through an ordinary launch tool and versioned `ui://` resource.

Static hosting cannot provide native MCP tools. The adapter does not invent capability mappings. Tool-backed apps must be distributed with a reachable MCP server.

## 8. Verification

`pnpm verify` proves:

- TypeScript authoring code compiles;
- each generated UI is self-contained and below 768 KiB;
- no OpenWork-specific runtime manifest or local mock records enter the resource;
- the server exposes the exact native tools and UI resource metadata; and
- standard calls preserve `content`, `structuredContent`, and `_meta`.
