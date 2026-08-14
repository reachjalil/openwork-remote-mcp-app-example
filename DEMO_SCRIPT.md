# OpenWork remote MCP Apps demo

This is a 7–10 minute demo of the product story: build a standard MCP App outside OpenWork, publish one self-contained HTML resource, install it into a Plugin through OpenWork Connect, then let the App discover and execute the user's authorized Connect tools and Code Mode Programs.

## Before the meeting

1. Pull and verify this repository:

   ```bash
   git clone https://github.com/reachjalil/openwork-remote-mcp-app-example.git
   cd openwork-remote-mcp-app-example
   pnpm install
   pnpm verify
   pnpm dev
   ```

2. Confirm all three frames at `http://localhost:5173/` say **Connected**.
3. In Project Atlas, search `migration`; expect **Atlas migration**.
4. In Capability Explorer, search `project portfolio`, choose **Search project portfolio**, and execute with `{"query":"migration"}`.
5. Confirm these published URLs return HTML:
   - `https://reachjalil.github.io/openwork-remote-mcp-app-example/project-atlas/index.html`
   - `https://reachjalil.github.io/openwork-remote-mcp-app-example/capability-explorer/index.html`
   - `https://reachjalil.github.io/openwork-remote-mcp-app-example/component-gallery/index.html`
6. Prepare an OpenWork organization with `codemodeScripts`/Programs available under its normal capability policy, at least one authorized Connect tool, and generated OpenWork UI authoring disabled.
7. Create or choose a Plugin named **MCP App Demo**. Keep its identifier handy if the agent needs disambiguation.

For the richest live result, add this repository's native server through Connect. Run `pnpm start:mcp`, expose port 8787 with a temporary HTTPS tunnel, and add `<tunnel-origin>/mcp` as a normal MCP connection. A tunnel is optional for the static import story.

## 1. Open with the product promise — 30 seconds

Say:

> “MCP Apps can be built anywhere. This repository is an ordinary Vite monorepo I can edit with any agent, run with mock data, publish as self-contained HTML, or deploy as a full standard MCP server. OpenWork installs and hosts the immutable resource, then mediates the user's existing Connect capabilities without putting credentials in the iframe.”

Show the repository root and point out `apps`, `packages`, `playground`, `scripts`, and generated `docs`.

## 2. Show independent local authoring — 90 seconds

Open `http://localhost:5173/`.

Say:

> “This playground is development-only. Each frame loads the same self-contained document we publish, performs the real MCP Apps postMessage handshake, receives launch data in structuredContent, and makes ordinary same-server tools/call requests.”

Demonstrate:

1. **Project Atlas:** search `migration`; open the returned row and show metrics/detail.
2. **Capability Explorer:** search `project portfolio`; select the exact result; execute it with approval language.
3. **Component Gallery:** switch between populated, loading, empty, and error states.

Point to the protocol log under each frame. Explain that fixture data lives in `fixtures/mock-data.json`, outside the compiled App bytes.

## 3. Prove it is portable — 45 seconds

Open the published Project Atlas URL directly:

`https://reachjalil.github.io/openwork-remote-mcp-app-example/project-atlas/index.html`

Say:

> “This is just the independent compiled resource. React was an authoring choice; this is not React SSR and React source is not the runtime protocol. The document has no provider data or credentials. By itself it waits for a compatible MCP Apps host.”

Optionally show `pnpm check`: the resource is complete, self-contained, under 768 KiB, and contains no fixture records.

## 4. Import it through an agent — 2 minutes

In OpenWork, give the agent this prompt (replace the Plugin name or identifier if needed):

> “Using OpenWork Connect, import the external MCP App at `https://reachjalil.github.io/openwork-remote-mcp-app-example/project-atlas/index.html` into my **MCP App Demo** Plugin. Do not author or submit UI source. Ask me to approve the installation before installing the third-party executable content.”

Expected proof:

1. The agent discovers the model-visible remote-App import tool.
2. The agent provides safe installation context and requests normal user approval.
3. After approval, OpenWork downloads and validates the HTTPS resource server-side.
4. The new App appears with the Plugin's other MCP capabilities.
5. Launch uses a versioned `ui://` resource backed by cached bytes, not a live GitHub iframe.

Say:

> “The URL importer is gateway behavior, not a new MCP primitive. OpenWork caches the exact bytes, computes a digest, creates an immutable revision, and exposes it through ordinary resources/read.”

## 5. Use Connect tools and Programs from the App — 2 minutes

Open the installed Project Atlas App and search `migration`.

Say:

> “The launch result supplied the exact app-visible search and execution tool names in structuredContent. The iframe first searches the capabilities this user is allowed to use, selects an exact result and schema digest, then calls the same OpenWork MCP server to execute it.”

If Project Atlas cannot identify a suitable project capability in the current organization, import and open Capability Explorer instead:

> “Using OpenWork Connect, import `https://reachjalil.github.io/openwork-remote-mcp-app-example/capability-explorer/index.html` into my **MCP App Demo** Plugin, with normal installation approval.”

Then search for a known Connect tool or Program by intent, select it, supply valid JSON arguments, and execute. Choose a read-only capability for the fastest demo. If you deliberately choose a write/destructive capability, show that OpenWork preserves its confirmation step.

Say:

> “The App never sees credentials and never talks directly to the underlying provider or another MCP server. OpenWork resolves the selected Connect tool or durable Program server-side, preserving access policy, confirmation, and audit behavior.”

## 6. Show native MCP App compatibility — 90 seconds

If the example MCP server is connected, ask the agent:

> “Use the connected OpenWork MCP App examples server and open Project Atlas.”

Expected proof:

1. The agent discovers `open_project_atlas` from ordinary `tools/list`.
2. The launch tool's exact `_meta.ui.resourceUri` points to `ui://openwork-examples/project-atlas/1.0.0/index.html`.
3. OpenWork reads the resource from the originating MCP server without conversion.
4. The App calls that same server's app-visible tools through the standard host bridge.

Say:

> “This is the interoperability baseline: any connected MCP server with standard UI metadata and resources should render naturally. The remote-URL path is an installation adapter for standalone documents, not a competing App protocol.”

## 7. Close with immutability and boundaries — 45 seconds

Show the revision-two URL:

`https://reachjalil.github.io/openwork-remote-mcp-app-example/v2/index.html`

Explain that importing it creates a new immutable revision rather than changing revision one in place. Activation, retirement, and rollback select stored revisions. The original resource remains usable even if GitHub Pages later changes or becomes unavailable.

Finish with:

> “The release boundary is simple: native MCP Apps are enabled, approved external HTML imports are enabled, and Programs remain available by organization policy. Agents can install external Apps, but OpenWork UI source authoring and server-side React compilation remain disabled.”

## Fast fallback plan

- If GitHub Pages is still deploying, use the original root URL or serve `docs` over any public HTTPS static host.
- If no useful Connect capability is authorized, demonstrate search/execution in the local playground and use Component Gallery for the live OpenWork import.
- If a tunnel is unavailable, skip the native-server segment; the published URL import remains fully demonstrable.
- If a capability is write/destructive, do not bypass confirmation. Use that moment to demonstrate preserved policy.
- If the original source URL is unavailable after installation, launch the cached revision to prove runtime independence.

## One-minute version

1. Show the three connected local frames.
2. Import the Project Atlas Pages URL through an agent and approve installation.
3. Launch the cached App and run one authorized capability.
4. State: self-contained external build, immutable `ui://` cache, ordinary MCP handshake/calls, credentials server-side, generated OpenWork UI authoring disabled.
