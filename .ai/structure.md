# AI Instruction Surface Framework

This framework sets out the meta rules for structuring and synchronizing AI assistant guidance.

## Latest Alignment Summary

**Date:** September 30, 2025  
**Session:** Rules alignment command execution - Content handling strategy correction  
**Branch:** rules-alignment

### Changes Completed

1. **CORRECTED content handling strategy** – Updated rulesalign instructions across all surfaces to properly handle different content types:
   - Commands: `.ai/commands/*.md` is source of truth, copy verbatim to all surfaces
   - Core instructions: `.github/instructions/*.md` is canonical, sync with format adaptations
   - Tool-specific rules: Merge latest from all sources, never delete directories
2. **Updated rulesalign command documentation** – Synchronized improved content handling logic across `.ai/commands/`, `.github/prompts/`, and `.cursor/commands/`
3. **Restored `.cursor/rules/` directory** – Recreated directory that was incorrectly deleted in previous session
4. **Enhanced structure.md workflow** – Added explicit content type handling rules to cross-surface alignment workflow
5. **Added preservation directive** – Explicit requirement to never delete tool-specific directories during alignment

### Structure Validation

- ✅ `.github/instructions/` contains canonical instruction files (core, frontend, backend)
- ✅ `.github/prompts/` contains authoritative command prompts (cleanup, codemap, rulesalign)
- ✅ `.cursor/instructions/` mirrors .github content in .mdc format
- ✅ `.cursor/commands/` contains synchronized command documentation
- ✅ `.cursor/rules/` directory restored for tool-specific rules
- ✅ `.ai/commands/` maintains source of truth for command content
- ✅ `codemaps/projectmap.md` provides current structural context

### Corrected Process

The alignment workflow now properly handles three distinct content types:

1. **Commands** (cleanup, codemap, rulesalign): Source of truth in `.ai/commands/`, copied verbatim
2. **Core Instructions** (core, frontend, backend): Canonical in `.github/instructions/`, adapted for other tools
3. **Tool-specific Rules**: Merged from latest versions across tools, directories preserved

### Outstanding Work

None – All instruction surfaces are now synchronized with the corrected content handling strategy.

---outstanding follow-ups discovered during alignment runs.

- When no actions are pending, the list **SHOULD** explicitly state "None".
- Entries **MAY** include owners or target dates when known.

_Current status: None_

## Latest Alignment Summary

**Date:** September 30, 2025  
**Session:** Rules alignment command execution  
**Branch:** rules-alignment

### Changes Completed

1. **Synchronized .cursor/commands/rulesalign.md** – Updated to match canonical .github/prompts/rulesalign.prompt.md content, replacing outdated workflow with current alignment process
2. **Removed duplicate .cursor/rules/ directory** – Eliminated redundant instruction surface that violated framework specifications
3. **Validated instruction file consistency** – Confirmed .github/instructions/, .cursor/instructions/, and .ai/commands/ contain synchronized content
4. **Verified command coverage** – All three commands (cleanup, codemap, rulesalign) now have consistent documentation across all surfaces

### Structure Validation

- ✅ `.github/instructions/` contains canonical instruction files (core, frontend, backend)
- ✅ `.github/prompts/` contains authoritative command prompts (cleanup, codemap, rulesalign)
- ✅ `.cursor/instructions/` mirrors .github content in .mdc format
- ✅ `.cursor/commands/` contains synchronized command documentation
- ✅ `.ai/commands/` maintains consistent command reference documentation
- ✅ `codemaps/projectmap.md` provides current structural context

### Outstanding Work

None – All instruction surfaces are now synchronized and compliant with the framework requirements.

---amples:\*\* Prefix examples with `Example:` and keep them distinct from directives to simplify extraction.

---

This framework provides the meta rules for organizing AI instruction surfaces. When uncertainty arises, update `.github` guidance first, document any lag for `.cursor`, and use codemaps to validate structural assumptions before finalizing changes., `.cursor`, `codemaps`, and `.ai` surfaces **MUST** be organized so that instructions stay consistent across tools.

## Normative Terms

| Keyword         | Definition                                                        | Usage Guidance                                                           |
| --------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **MUST**        | Absolute requirement; non-compliance is a violation.              | Use for directives that cannot be skipped under any circumstance.        |
| **MUST NOT**    | Absolute prohibition.                                             | Use to forbid actions or configurations outright.                        |
| **REQUIRED**    | Synonym for **MUST**.                                             | Prefer **MUST** for clarity unless quoting external policy.              |
| **SHALL**       | Synonym for **MUST** often used in contractual contexts.          | Reserve for clauses that need a formal tone or match external standards. |
| **SHALL NOT**   | Synonym for **MUST NOT**.                                         | Apply when mirroring legal or standards language.                        |
| **SHOULD**      | Strong recommendation; deviations are allowed with justification. | Record any justified deviations in normal project tracking notes.        |
| **SHOULD NOT**  | Advisory prohibition with allowed exceptions.                     | Record rationale when exceptions occur.                                  |
| **RECOMMENDED** | Synonym for **SHOULD**.                                           | Use when emphasizing best practices without making them mandatory.       |
| **MAY**         | Optional action that is safe to omit.                             | Pair with conditions describing when the option is useful.               |
| **OPTIONAL**    | Synonym for **MAY**.                                              | Use sparingly to avoid redundancy.                                       |

> **Usage Notes**
>
> - Write each directive in uppercase to align with RFC 2119 conventions.
> - Avoid mixing multiple normative keywords in a single sentence; split complex guidance into separate statements.
> - If you depart from a **SHOULD** or **SHOULD NOT** directive, record the rationale in the related automation logs.

## Instruction Surfaces Overview

- `.github/` hosts GitHub-focused automation and **MUST** include the authoritative instruction set for GitHub Copilot.
- `.cursor/` hosts Cursor-specific assets and **MUST** mirror the structural intent of the `.github` guidance.
- `codemaps/` stores structural documentation that **SHOULD** inform and validate instruction updates.
- `.ai/features/codemap.md` captures codemap meta rules and, when present, **MUST** be referenced whenever instruction boundaries or terminology are aligned.

Keep every surface synchronized. Capture any divergence with a remediation plan. When available, treat the meta rules in `.ai/features/codemap.md` as the canonical source for aligning terminology, boundaries, and expectations across all tool-specific instruction sets.

## `.github` Instruction Surface

### Directory Layout

- `.github/instructions/` **MUST** exist and contain instruction files grouped by scope (for example, `general`, `backend`, `frontend`, or other context-relevant domains).
- Filenames **SHOULD** use a consistent suffix (such as `.instructions.md`) to make their purpose clear.
- Add a manifest or index file if automation needs an explicit ordering; doing so **MAY** help keep processes deterministic.

### Scope Layering

- A global or core instruction file **MUST** remain active for every editing session to provide consistent context regardless of which files are touched.
- Additional instruction files **SHOULD** target specific workspaces, packages, or modules, activating only when edits fall within their defined boundaries.
- In monorepo environments, you **MAY** rely on workspace boundaries defined by the codemap to author specialized instructions, provided those instructions stay consistent with the authoritative codemap metadata.

### Content Requirements

- Each instruction file **MUST** include clearly labeled sections such as “Directives”, “Constraints”, and “Examples” (or equivalent headings that convey intent).
- Place guidance that applies to every scope in the “general” document to avoid duplication; doing so **SHOULD** keep the content easy to find.
- Keep tooling references, command names, and repository paths accurate. If you have to make an assumption, validate it before proceeding.

### Maintenance Workflow

- When guidance changes, update every affected `.github/instructions/` file in the same alignment session.
- Example: after introducing a new deployment policy, update the relevant scope file and document that Cursor parity is pending until regenerated.

## `.cursor` Instruction Surface

### Directory Layout

- `.cursor/instructions/` **MUST** exist (even as a placeholder) for Cursor-specific guidance.
- Files **SHOULD** use a predictable extension such as `.mdc` or another Cursor-compatible format.
- Mirror the section names and ordering from `.github/instructions/`, changing only what Cursor-specific formatting requires.

### Scope Layering

- Cursor’s global instruction artifact **MUST** mirror the always-on guidance from the `.github` core file so the baseline context matches across tools.
- Additional Cursor instruction files **SHOULD** activate only for the workspaces or modules they document, following the same boundaries as their `.github` counterparts.
- Monorepo-specific Cursor instructions **MAY** provide deeper rules per workspace, but they **MUST** remain consistent with the codemap definitions described in `.ai/features/codemap.md`.

### Content Requirements

- Each document **MUST** express the same guidance as the corresponding `.github` file, translated into Cursor’s syntax.
- Formatting-specific wrappers (metadata headers, fenced directives) **MAY** differ, but keep the substantive rules matching verbatim wherever possible.
- Placeholder files **SHOULD** state that content will be synchronized once available to prevent ambiguity during automation.

### Maintenance Workflow

- Whenever `.github` instructions change, regenerate the `.cursor` equivalents or flag them with a target completion date.
- Use automation scripts when available to transform Markdown into Cursor format. If you edit manually, follow the same alignment checklist described below.
- Example: after updating a testing guideline in `.github/instructions/testing.instructions.md`, run the conversion pipeline to refresh the `.cursor` version and verify section parity.

## `codemaps` Structural Surface

### Directory Layout

- `codemaps/` **MUST** store generated artifacts that describe the repository structure (project maps, module diagrams, and related views).
- Each artifact **SHOULD** include a timestamp or version marker to make it easy to spot staleness.
- Older maps **MAY** be archived under `codemaps/archive/` when superseded.

### Usage Requirements

- Alignment sessions **MUST** consult the most recent codemap to verify that instructions reference the correct modules and paths.
- If no codemap exists, record the gap and schedule a regeneration; doing so **SHOULD** keep the documentation trustworthy.
- Example: before adding a new module directive, confirm through the codemap that the module hierarchy matches the intended rule.

### Maintenance Workflow

- Running the codemap generation routine **MUST** update or replace the primary artifact in `codemaps/`.
- Follow the meta requirements documented in `.ai/features/codemap.md` when authoring codemaps.

## Cross-Surface Alignment Workflow

1. **Inventory** — Inspect every instruction or prompt artifact under `.github`, `.github/prompts`, `.cursor`, and `.ai/commands`. Review each file for accuracy and consult supporting meta-docs for prior notes.
2. **Validate Structure** — Compare instructions against the current codemap. Resolve or note any mismatch in normal project tracking.
3. **Normalize Guidance** — Draft a tool-agnostic summary of the changes before producing tool-specific formatting. **For commands**: Use `.ai/commands/*.md` as source of truth. **For instructions**: Use `.github/instructions/*.md` as canonical source. **For tool-specific rules**: Merge latest versions to create coherent combined version.
4. **Emit Variants** — **Start by updating `.github/instructions` and `.github/prompts` first**, then propagate to `.cursor` surfaces and other tool-specific locations. **NEVER delete tool-specific directories** - they serve different purposes than general instructions. Document any intentional deviations externally.
5. **Record Outcomes** — Capture summaries, decisions, and follow-ups in standard project tracking locations (issues, PR descriptions, etc.) so future runs inherit the latest context.

## Command Contracts

### `/cleanup`

- **Purpose:** Execute the workspace’s cleanup routine across modified artifacts.
- **MUST:** Follow the canonical cleanup checklist documented for the repository (for example, `guides/routines/{routine}.md`).
- **MUST:** Record progress in a run-specific artifact (such as `cleanup-progress.md`) or in the session log for traceability.
- **SHOULD:** Note any deviations (such as excluded files or intentional skips) alongside their justification.
- **MAY:** Extend the routine to adjacent files when a broader refactor is in scope.

**Example:** After modifying a shared UI component, update the cleanup log with the checklist status and link to the change that resolved the findings.

### `/codemap`

- **Purpose:** Generate or refresh structural maps that describe the repository topology.
- **MUST:** Run the codemap tooling defined by the workspace and store outputs under `codemaps/` with timestamped filenames.
- **MUST:** Replace or archive stale maps to avoid conflicting guidance.
- **MAY:** Produce focused maps (per service or feature area) when the repository is large.

**Example:** After reorganizing a feature directory tree, regenerate the codemap and update the repository artifacts.

### `/alignrules`

- **Purpose:** Synchronize instruction files across all supported tooling surfaces.
- **MUST:** Execute the complete alignment workflow described above during each run.
- **MUST:** Update every impacted instruction file within the same branch or change set.
- **MUST:** Preserve all tool-specific directories (never delete `.cursor/rules/` or similar).
- **MUST:** Use `.ai/commands/*.md` as source of truth for command content.
- **MUST:** Use `.github/instructions/*.md` as canonical source for core instruction content.
- **MAY:** Use automation to convert Markdown to tool-specific formats, provided the resulting content remains semantically identical.

**Example:** When adding guidance for a new feature flag convention, update the relevant `.github` scopes, regenerate the `.cursor` equivalents, and document the alignment status in the project tracking system if follow-up is required.

## Structural Recommendations for AI Agents

- **Introduce metadata upfront:** Consider adding a lightweight YAML or JSON front matter block that lists the document version, last alignment date, and expected tooling surfaces.
- **Maintain consistent heading depth:** Keep top-level sections for surfaces, workflows, and commands to support deterministic parsing.
- **Prefer numbered checklists for processes:** This approach aligns with automation that tokenizes instructions step-by-step.
- **Reference glossary identifiers:** Link back to Normative Terms when using keywords so agents can validate intent quickly.
- **Annotate examples:** Prefix examples with `Example:` and keep them distinct from directives to simplify extraction.

## Reference Notes

This framework defines organization and synchronization principles for instruction surfaces. When uncertainty arises, rely on the canonical sources (`.github/instructions` for core instructions and `.ai/commands` for command content) and validate structural assumptions via the latest codemap artifacts.
