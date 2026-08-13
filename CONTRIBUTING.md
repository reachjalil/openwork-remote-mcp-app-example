# Contributing

Project Atlas is deliberately small so a human or coding agent can fork it and turn it into a different standard MCP App.

1. Create a focused branch.
2. Run `pnpm dev` and make the complete handshake and native same-server tool call visible in the local playground.
3. Keep mock provider behavior deterministic and free of secrets.
4. Run `pnpm verify` to regenerate and validate both portable revisions.
5. Commit source and generated HTML together.
6. Explain any native tool or resource-contract change in the pull request.

See `EXECUTION_CONTRACT.md` for the security and runtime boundary and `AGENTS.md` for repository-specific agent instructions.
