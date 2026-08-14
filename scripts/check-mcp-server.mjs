import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  EXAMPLES,
  EXECUTE_CAPABILITY_TOOL,
  PROJECT_ATLAS_SEARCH_TOOL,
  SEARCH_CAPABILITIES_TOOL,
  createExampleMcpServer,
} from "./mcp-server.mjs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = await createExampleMcpServer();
const client = new Client(
  { name: "openwork-mcp-app-examples-contract-check", version: "2.0.0" },
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
  const listed = await client.listTools();
  assert(listed.tools.length === 6, `Expected 6 tools; received ${listed.tools.length}.`);

  for (const example of Object.values(EXAMPLES)) {
    const launchTool = listed.tools.find((tool) => tool.name === example.openTool);
    assert(launchTool?._meta?.ui?.resourceUri === example.resourceUri, `${example.openTool} does not reference its exact UI resource.`);
    const resource = await client.readResource({ uri: example.resourceUri });
    const content = resource.contents[0];
    assert(content?.mimeType === "text/html;profile=mcp-app", `${example.title} has the wrong MCP App MIME type.`);
    assert("text" in content && content.text.includes(example.title), `${example.title} resource content is invalid.`);
  }

  for (const toolName of [SEARCH_CAPABILITIES_TOOL, EXECUTE_CAPABILITY_TOOL, PROJECT_ATLAS_SEARCH_TOOL]) {
    const tool = listed.tools.find((candidate) => candidate.name === toolName);
    assert(tool?._meta?.ui?.visibility?.includes("app"), `${toolName} is not app-visible.`);
    assert(!tool?._meta?.ui?.visibility?.includes("model"), `${toolName} should not be model-visible in this example.`);
  }

  const atlasLaunch = await client.callTool({ name: EXAMPLES.projectAtlas.openTool, arguments: {} });
  const explorerLaunch = await client.callTool({ name: EXAMPLES.capabilityExplorer.openTool, arguments: {} });
  const galleryLaunch = await client.callTool({ name: EXAMPLES.componentGallery.openTool, arguments: {} });
  const expectedGateway = JSON.stringify({ searchCapabilities: SEARCH_CAPABILITIES_TOOL, executeCapability: EXECUTE_CAPABILITY_TOOL });
  assert(JSON.stringify(atlasLaunch.structuredContent?.serverTools) === expectedGateway, "Project Atlas launch is missing the exact capability gateway names.");
  assert(JSON.stringify(explorerLaunch.structuredContent?.serverTools) === expectedGateway, "Capability Explorer launch is missing the exact capability gateway names.");
  assert(Array.isArray(galleryLaunch.structuredContent?.gallery?.records), "Component Gallery launch is missing structured records.");
  assert(atlasLaunch._meta?.exampleRevision === "1.0.0", "Launch result _meta was not preserved.");

  const search = await client.callTool({
    name: SEARCH_CAPABILITIES_TOOL,
    arguments: { query: "project portfolio", type: "all", limit: 10 },
  });
  const match = search.structuredContent?.matches?.find((candidate) => candidate.name === "demo.projects.search");
  assert(match, "Capability search did not return the project search capability.");
  const execution = await client.callTool({
    name: EXECUTE_CAPABILITY_TOOL,
    arguments: { name: match.name, schemaDigest: match.schemaDigest, body: { query: "migration" } },
  });
  assert(JSON.stringify(execution.structuredContent).includes("project-lighthouse"), "Exact capability execution did not return structured project data.");
  assert(execution._meta?.capabilityName === match.name, "Execution result _meta was not preserved.");

  const directSearch = await client.callTool({ name: PROJECT_ATLAS_SEARCH_TOOL, arguments: { query: "migration" } });
  assert(JSON.stringify(directSearch.structuredContent).includes("project-lighthouse"), "Native same-server search did not return structured project data.");

  console.log(`MCP server: ${listed.tools.length} tools, ${Object.keys(EXAMPLES).length} versioned resources, launch metadata, capability search/execution, and native fallback verified`);
} finally {
  await client.close();
  await server.close();
}
