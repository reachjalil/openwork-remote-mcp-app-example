import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  PROJECT_ATLAS_OPEN_TOOL,
  PROJECT_ATLAS_RESOURCE_URI,
  PROJECT_ATLAS_SEARCH_TOOL,
  createProjectAtlasMcpServer,
} from "./mcp-server.mjs";

const server = await createProjectAtlasMcpServer();
const client = new Client(
  { name: "project-atlas-contract-check", version: "1.0.0" },
  {
    capabilities: {
      extensions: {
        "io.modelcontextprotocol/ui": { mimeTypes: ["text/html;profile=mcp-app"] },
      },
    },
  },
);
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await server.connect(serverTransport);
await client.connect(clientTransport);

try {
  const tools = await client.listTools();
  const openTool = tools.tools.find((tool) => tool.name === PROJECT_ATLAS_OPEN_TOOL);
  const searchTool = tools.tools.find((tool) => tool.name === PROJECT_ATLAS_SEARCH_TOOL);
  if (openTool?._meta?.ui?.resourceUri !== PROJECT_ATLAS_RESOURCE_URI) throw new Error("The launch tool does not reference the exact UI resource.");
  if (!searchTool || searchTool._meta?.ui?.visibility?.[0] !== "app") throw new Error("The app-only same-server search tool is missing.");

  const resource = await client.readResource({ uri: PROJECT_ATLAS_RESOURCE_URI });
  const content = resource.contents[0];
  if (!content || content.mimeType !== "text/html;profile=mcp-app" || !("text" in content) || !content.text.includes("Project Atlas")) {
    throw new Error("The standard MCP App resource is invalid.");
  }

  const launch = await client.callTool({ name: PROJECT_ATLAS_OPEN_TOOL, arguments: { query: "migration" } });
  const search = await client.callTool({ name: PROJECT_ATLAS_SEARCH_TOOL, arguments: { query: "migration" } });
  if (!JSON.stringify(launch.structuredContent).includes("project-lighthouse")) throw new Error("Launch structuredContent is missing mock data.");
  if (!JSON.stringify(search.structuredContent).includes("project-lighthouse")) throw new Error("Same-server tool structuredContent is missing mock data.");
  if (launch._meta?.projectAtlasRevision !== "1.0.0" || search._meta?.projectAtlasRevision !== "1.0.0") {
    throw new Error("MCP result _meta was not preserved by the server definition.");
  }
  console.log(`MCP server: ${tools.tools.length} native tools, ${PROJECT_ATLAS_RESOURCE_URI}, exact metadata and structuredContent verified`);
} finally {
  await client.close();
  await server.close();
}
