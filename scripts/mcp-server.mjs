import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import {
  EXTENSION_ID,
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

export const PROJECT_ATLAS_RESOURCE_URI = "ui://project-atlas/view.html";
export const PROJECT_ATLAS_OPEN_TOOL = "open_project_atlas";
export const PROJECT_ATLAS_SEARCH_TOOL = "search_projects";

async function loadMockProjects() {
  return JSON.parse(await readFile(new URL("../src/mock-data.json", import.meta.url), "utf8"));
}

function searchProjects(projects, query) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return projects;
  return projects.filter((project) => [project.name, project.summary, project.status, project.owner]
    .join(" ")
    .toLocaleLowerCase()
    .includes(normalized));
}

export async function createProjectAtlasMcpServer(options = {}) {
  const resourceHtml = options.resourceHtml
    ?? await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
  const projects = options.projects ?? await loadMockProjects();
  const server = new McpServer(
    { name: "project-atlas", version: "1.0.0" },
    {
      capabilities: {
        extensions: {
          [EXTENSION_ID]: { mimeTypes: [RESOURCE_MIME_TYPE] },
        },
      },
      instructions: "Open Project Atlas with open_project_atlas. Its UI may call search_projects on this same MCP server.",
    },
  );

  registerAppResource(
    server,
    "project-atlas-ui",
    PROJECT_ATLAS_RESOURCE_URI,
    {
      title: "Project Atlas",
      description: "A self-contained standard MCP App resource.",
      _meta: {
        ui: {
          csp: { connectDomains: [], resourceDomains: [] },
          prefersBorder: true,
        },
      },
    },
    async () => ({
      contents: [{
        uri: PROJECT_ATLAS_RESOURCE_URI,
        mimeType: RESOURCE_MIME_TYPE,
        text: resourceHtml,
        _meta: {
          ui: {
            csp: { connectDomains: [], resourceDomains: [] },
            prefersBorder: true,
          },
        },
      }],
    }),
  );

  registerAppTool(
    server,
    PROJECT_ATLAS_OPEN_TOOL,
    {
      title: "Open Project Atlas",
      description: "Open the Project Atlas project explorer.",
      inputSchema: z.object({ query: z.string().optional() }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: { ui: { resourceUri: PROJECT_ATLAS_RESOURCE_URI, visibility: ["model", "app"] } },
    },
    async ({ query = "migration" }) => {
      const matches = searchProjects(projects, query);
      return {
        content: [{ type: "text", text: `Opened Project Atlas with ${matches.length} matching project(s).` }],
        structuredContent: { source: "Project Atlas MCP server", query, projects: matches },
        _meta: { projectAtlasRevision: "1.0.0" },
      };
    },
  );

  server.registerTool(
    PROJECT_ATLAS_SEARCH_TOOL,
    {
      title: "Search projects",
      description: "Search the Project Atlas project catalog.",
      inputSchema: z.object({ query: z.string().default("") }),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ query }) => {
      const matches = searchProjects(projects, query);
      return {
        content: [{ type: "text", text: `Found ${matches.length} project(s) for “${query}”.` }],
        structuredContent: { source: "Project Atlas MCP server", query, projects: matches },
        _meta: { projectAtlasRevision: "1.0.0" },
      };
    },
  );

  return server;
}

export function startProjectAtlasMcpServer(options = {}) {
  const port = Number(options.port ?? process.env.PORT ?? 8787);
  const host = options.host ?? process.env.HOST ?? "127.0.0.1";
  const httpServer = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname;
    if (pathname !== "/mcp" || request.method !== "POST") {
      response.writeHead(pathname === "/mcp" ? 405 : 404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: pathname === "/mcp" ? "method_not_allowed" : "not_found" }));
      return;
    }
    const mcpServer = await createProjectAtlasMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    response.on("close", () => {
      void transport.close();
      void mcpServer.close();
    });
    try {
      await mcpServer.connect(transport);
      await transport.handleRequest(request, response);
    } catch (error) {
      if (!response.headersSent) {
        response.writeHead(500, { "content-type": "application/json" });
        response.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32603, message: "Internal server error" } }));
      }
      console.error(error);
    }
  });
  httpServer.listen(port, host, () => {
    console.log(`Project Atlas MCP server listening on http://${host}:${port}/mcp`);
  });
  return httpServer;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  startProjectAtlasMcpServer();
}
