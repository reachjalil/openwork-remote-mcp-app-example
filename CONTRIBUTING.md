# Contributing

These examples are intentionally compact so a person or coding agent can fork the monorepo, add a UI, and test it as a standard MCP App.

1. Create a focused branch.
2. Add or edit an App under `apps`, reusing the shared runtime and UI packages where useful.
3. Keep local/provider fixtures deterministic and free of secrets.
4. Use `pnpm dev` to verify the complete handshake, launch result, and relevant same-server tool calls.
5. Run `pnpm verify` to regenerate and validate every portable resource and the standard MCP server.
6. Commit source and generated `docs` output together.
7. Explain any tool, resource URI, visibility, CSP, schema, or execution-contract change in the pull request.

See [`EXECUTION_CONTRACT.md`](EXECUTION_CONTRACT.md) for the runtime boundary and [`AGENTS.md`](AGENTS.md) for repository-specific agent instructions.
