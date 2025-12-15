# `/rulesalign`

The `/rulesalign` command synchronizes every instruction surface (.github, .cursor, codemaps, and `.ai`) so that tooling guidance, automation contracts, and command references remain identical across editors.

## When to Run

- Initiating or reviewing changes to any instruction files under `.github/` or `.cursor/`
- Adding, renaming, or deprecating commands referenced by automation (for example `/cleanup`, `/codemap`)
- After codemap updates that introduce new instruction boundaries or terminology

## Preconditions

1. **Branch preparation**: Work on a dedicated branch with a clean git status before starting alignment.
2. **Context gathering**: Review `.ai/structure.md` (reference-only), the latest entries in `codemaps/`, and all instruction files that will be modified.
3. **Tool surface audit**: Enumerate every AI/editor integration in use (for example GitHub prompts, Cursor commands, VS Code snippets) and note the files that define the shared commands.
4. **Template readiness**: Ensure command or instruction templates (if any) are available so regenerated files follow repository conventions.

## Alignment Workflow

Follow the cross-surface workflow (reference the framework document for principles) and expand each step as described below:

1. **Inventory**
   - List every instruction artifact across `.github/`, `.github/prompts/` (or equivalent), `.cursor/`, `.ai/commands/`, and related docs.
   - Note version metadata, owners, or last-updated dates if present.
2. **Validate Structure**
   - Compare instructions against the current codemap hierarchy and project layout.
   - Record any discrepancies (missing sections, outdated file paths, stale terminology) in a scratch log.
3. **Normalize Guidance**
   - Draft a canonical summary of the desired rules, commands, and terminology.
   - **For commands**: Treat `.ai/commands/*.md` as the source of truth - replicate verbatim to other surfaces.
   - **For instruction files**: Use `.github/instructions/*.md` as the canonical source - sync to other tools with format adaptations only.
   - **For generated/tool-specific rules**: Merge latest versions from all sources to create coherent combined version, then propagate.
   - Resolve conflicts by prioritizing: 1) `.ai/commands/` for commands, 2) `.github/instructions/` for core instructions, 3) newest timestamp for tool-specific rules.
4. **Emit Variants**
   - **ALWAYS start with updating `.github/instructions` and `.github/prompts` first**.
   - For commands: Copy `.ai/commands/*.md` content verbatim to `.github/prompts/` and `.cursor/commands/` with only format header changes.
   - For core instructions: Copy `.github/instructions/*.md` to `.cursor/instructions/` and other tool surfaces with format adaptations.
   - For tool-specific rules (e.g., `.cursor/rules/`): Merge and sync across corresponding directories in each tool.
   - **NEVER delete tool-specific directories** - they serve different purposes than general instructions.
   - Maintain identical section ordering unless a tool mandates alternative formatting.

## Outputs & Verification

- ✅ All instruction files edited during the session share synchronized content and normative language.
- ✅ Command documentation in `.ai/commands/` reflects the same behavior described in `.github` and `.cursor` surfaces.
- ✅ Codemap(s) reference the updated commands or rules when applicable.
- ✅ A concise alignment summary (changelog, pull-request notes, or log entry) captures what changed and why.

## Post-Run Follow-Ups

- Notify collaborators who maintain automation or CI systems that consume the updated instructions. Track any pending conversions in standard project tracking (issue or PR notes).
- Re-run `/rulesalign` after substantial structural refactors or when onboarding new instruction surfaces.

## Escalation Triggers

- **MUST stop** and request guidance if conflicting policies cannot be reconciled from available sources.
- **MUST preserve** all tool-specific directories (e.g., `.cursor/rules/`, `.cursor/instructions/`) - never delete them during alignment.
- **SHOULD schedule** a codemap regeneration (`/codemap`) when instruction mismatches stem from outdated structural documentation.
- **MAY defer** low-risk cosmetic differences (formatting-only) but must log them as follow-ups if left unresolved.
