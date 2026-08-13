# Remote MCP App execution contract

This repository demonstrates the boundary between an independently authored web application and an OpenWork-managed Remote MCP App.

## 1. Authoring contract

The repository is an ordinary open-source web project. Authors may:

- use Vite, React, another framework, or no framework;
- run and test entirely on a local machine;
- use any coding agent that can work in the repository;
- replace the sample UI and deterministic mock data; and
- publish from GitHub Pages or any static HTTPS origin.

OpenWork does not require or execute the source repository. The repository is useful for humans and authoring agents; the compiled HTML file is the import boundary.

## 2. Portable artifact contract

The import URL must return a complete HTML document no larger than 768 KiB. The document must be self-contained: scripts, styles, framework runtime, and the MCP Apps client are inlined. It must not rely on runtime network access to load its application code.

The document embeds an `openwork.remote-mcp-app/1` JSON manifest that declares:

- stable app identity, version, and description;
- launch-tool display metadata; and
- requested capabilities with stable keys, source tool names, read/write access, and required/optional status.

The manifest is declarative input to import. It is not a credential, an OpenWork connection, or an executable MCP server.

## 3. Local execution contract

`pnpm dev` runs two independent pieces in one Vite development server:

1. The app view in `src/main.tsx` uses `@modelcontextprotocol/ext-apps` as a strict MCP Apps client.
2. The playground in `src/playground.ts` uses the SDK's `AppBridge` as a local host.

The host and app complete the same protocol sequence used after import:

```text
App view              Local/OpenWork host             Connect provider
   | -- initialize ----------> |
   | <---- initialize result -- |
   | -- initialized ---------> |
   | <---- tool input/result -- |  launch structuredContent
   | -- tools/call ----------> | -- mapped tool call -->
   | <---- tool result -------- | <-- provider result ---
```

The local host answers the generated proxy tool with `src/mock-data.ts`. In OpenWork, the provider call instead goes through the user's selected OpenWork Connect connection. The app code is unchanged.

## 4. Data and credential boundary

The portable bundle contains presentation logic and capability requests. It does not contain:

- mock provider records;
- OpenWork Connect connection IDs;
- source MCP tool names selected during mapping;
- access tokens, API keys, cookies, or provider credentials; or
- a direct network integration with the backing service.

At launch, OpenWork sends only the app metadata and generated proxy tool names required for that imported app. When the app calls one of those names, the provider validates the app/revision/capability scope, invokes the mapped Connect tool, and returns standard MCP content and `structuredContent`.

Artifact data and the UI bundle therefore remain separate. The view receives only the result for the current launch or scoped capability call.

## 5. Import and immutable execution

For each import or refresh, OpenWork:

1. fetches the public URL under its download and redirect policy;
2. applies document, schema, CSP, and size validation;
3. computes a digest and stores the source URL, compiled HTML, manifest, diagnostics, and immutable revision metadata;
4. creates a versioned `ui://` resource URI for that revision;
5. registers an exact render tool whose `_meta.ui.resourceUri` references that resource;
6. exposes launch and scoped proxy tools through the OpenWork MCP provider; and
7. activates a selected revision without mutating older revisions.

The cached HTML is the MCP App resource. A source URL changing does not silently change an active revision. Refresh creates a candidate revision that can be previewed and then activated; an older healthy revision can be restored.

## 6. Cloud and host responsibilities

OpenWork's server/provider layer owns import metadata, immutable cached resources, capability bindings, tool registration, discovery notifications, and Connect-backed execution. Agents discover and call those tools through their OpenWork MCP connection, including from supported Cloud execution environments.

A compatible Desktop or web MCP Apps host owns sandboxed iframe rendering, handshake isolation, CSP enforcement, size limits, teardown, and recovery. Cloud agent execution of a proxy tool does not imply that Vite, React source, or an iframe runs inside the agent process.

The source host is needed only when importing or refreshing. Once cached and activated, runtime operation uses OpenWork's immutable copy and the user's Connect capabilities.

## 7. Compatibility checklist

Before publishing a revision:

- run `pnpm verify`;
- keep the manifest and local launch payload semantically aligned;
- keep capability keys stable across revisions when they represent the same permission;
- treat a change to access, required status, or source tool as a reviewable contract change;
- never add credentials or real user data to source, fixtures, or generated HTML;
- verify the final public URL returns the exact committed bytes; and
- import as a new immutable revision rather than overwriting an active cached bundle.
