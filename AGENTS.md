# Agent guide for Project Atlas

This repository is an open authoring workspace for a Remote MCP App. Agents may freely improve the experience while preserving the portable execution contract below.

## Start and verify

```bash
pnpm install
pnpm dev
pnpm verify
```

Use `playground.html` for the complete local handshake and tool-call loop. Use `/` only to inspect the standalone bundle view.

## Safe editing surfaces

- Change the app experience in `src/main.tsx` and `src/styles.css`.
- Change deterministic local provider behavior in `src/mock-data.ts` and `src/playground.ts`.
- Change declared import metadata in the JSON manifest inside `index.html`.
- Rebuild `docs/index.html` and `docs/v2/index.html` with `pnpm build`; do not hand-edit generated documents.

## Contract invariants

1. The published artifact is one complete, self-contained HTML document under 768 KiB.
2. The app runtime uses the stable MCP Apps protocol; React is only an authoring choice.
3. Launch-time app and capability mappings arrive in tool-result `structuredContent`.
4. The app calls only the generated proxy tool name supplied by the host.
5. Provider credentials, connection IDs, real user data, and mock host data must never enter the compiled artifact.
6. The artifact must not require runtime script, stylesheet, font, image, API, or source-repository access.
7. Capabilities stay deny-by-default. Keep this example's Project search capability required and read-only unless intentionally updating the entire example contract.
8. If capabilities change, update the manifest, local host launch payload, verification checks, and documentation together.

## Agent acceptance check

After a change, run `pnpm verify`, start `pnpm dev`, confirm the playground reaches **Connected**, and call Project search at least once. Report generated bundle sizes and any deferred browser or OpenWork import verification honestly.
