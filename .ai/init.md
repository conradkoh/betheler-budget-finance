# AI Assistant Initialization Guide

Follow these steps in order. Only open the referenced files when the step instructs you to, so context stays fresh and the workflow remains reliable.

## Step 0 · Prepare the workspace

- Confirm the git working directory is clean.
- Make note of the current branch that will hold alignment changes.
- Close any instruction files you already have open.

## Step 1 · Load the framework (read only)

1. Open `.ai/structure.md`.
2. Read it top to bottom once, focusing on:
   - “Instruction Surfaces Overview” and the per-surface sections.
   - “Cross-Surface Consistency” / similar workflow context.
   - “Command Contracts”.
3. Close the file after reading; treat it as reference-only for the remainder of this session.

## Step 2 · Distribute command definitions

Process each file in `.ai/commands/` one at a time as authoritative reference material:

1. Open a command file (for example `rulesalign.md`) and consult its documentation to understand intended behavior across other surfaces.
2. Apply/replicate the documented command behavior into the appropriate locations (e.g. `.github/prompts/`, `.cursor/commands/`) using the existing repository conventions.
3. Finish syncing that command before moving to the next file.
4. After all commands are mirrored, use `/rulesalign` to verify surfaces stay in sync.

## Step 3 · Inspect the project structure

1. Review repository configuration files that describe workspace boundaries (e.g. `pnpm-workspace.yaml`, `nx.json`, `package.json`, or tool-specific configs).
2. Walk the top-level directories (`apps/`, `services/`, `packages/`, etc.) to confirm actual layout.
3. Record the workspace names, shared libraries, and any special tooling you discover—these inform scope-specific rules.

## Step 4 · Author scope-specific rules

1. For each scope identified in Step 3, create or update the corresponding instruction files:
   - `.github/instructions/*.instructions.md` (for GitHub Copilot)
   - `.cursor/rules/*.md` (for Cursor IDE - manually managed)
2. Use the framework guidance (from Step 1) and your Step 3 notes to tailor rules to each workspace or feature area.
3. After each file is updated, close it and record any follow-ups in normal project tracking (issue, PR notes, etc.).

**Note:** Instructions are tool-specific and NOT synced between GitHub and Cursor.

## Step 5 · Document the architecture

1. Open `codemaps/projectmap.md` (or the template in `codemaps/templates/` if it does not exist).
2. Populate or refresh the project map using the information gathered in Step 3 and the finalized instructions from Step 4.
3. Keep the project map focused on structure—do not restate rules already captured in instruction files.

## Step 6 · Finalize and verify

1. Re-run the `/rulesalign` command to ensure every surface is synchronized.
2. Spot-check that `.github/instructions/`, `.github/prompts/`, `.cursor/commands/`, and `.cursor/rules/` express consistent guidance.
3. Stage changes and prepare them for review according to repository conventions.

---

By following this staged process, agents rely on authoritative sources exactly when needed, avoid duplicating guidance, and keep all instruction surfaces aligned across the project.
