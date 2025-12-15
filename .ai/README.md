# AI Assistant Configuration

This directory contains the canonical source of truth for AI assistant commands and the framework structure.

## Directory Structure

```
.ai/
├── commands/           # Source of truth for all AI commands
│   ├── cleanup.md     # Code quality cleanup command
│   ├── codemap.md     # Codemap generation command
│   └── rulesalign.md  # Cross-surface alignment command
├── init.md            # Manual initialization guide
├── apply.sh           # Automated apply script (distributes commands)
├── structure.md       # Framework documentation
└── README.md          # This file
```

## Quick Start

### Automated Initialization

Run the apply script to automatically distribute commands to all surfaces:

```bash
.ai/apply.sh
```

**Preview changes first (recommended):**

```bash
.ai/apply.sh --dry-run
```

**Force run with uncommitted changes:**

```bash
.ai/apply.sh --force
```

This script will:

1. ✅ Check `.cursor/` and `.github/` directories are clean (unless `--force`)
2. 📦 Create target directories if needed
3. 🔄 Distribute commands from `.ai/commands/` to:
   - `.github/prompts/*.prompt.md` (with agent frontmatter)
   - `.cursor/commands/*.md` (with agent frontmatter)
4. 📊 Display summary and next steps

**Options:**

- `--dry-run` or `-n`: Preview what would be changed without modifying files
- `--force` or `-f`: Force run even if `.cursor/` or `.github/` have uncommitted changes
- `--help` or `-h`: Show help message

### Manual Initialization

If you prefer manual control, follow the step-by-step guide in [`init.md`](./init.md).

## Command Sources

All command definitions in `.ai/commands/*.md` are the **source of truth** and should be:

- ✅ Modified only in `.ai/commands/`
- ✅ Distributed to other surfaces using `apply.sh`
- ❌ Never edited directly in `.github/prompts/` or `.cursor/commands/`

### Current Commands

| Command       | Purpose                                    |
| ------------- | ------------------------------------------ |
| `/cleanup`    | Systematic code quality improvements       |
| `/codemap`    | Generate and update project structure maps |
| `/rulesalign` | Synchronize instruction surfaces           |

## Instruction Sources

Core instruction files in `.github/instructions/*.instructions.md` are used by **GitHub Copilot**:

- `core.instructions.md` - General coding principles and rules
- `frontend.instructions.md` - Frontend-specific guidelines
- `backend.instructions.md` - Backend-specific guidelines

**Note:** These are NOT automatically synced to Cursor. Cursor uses its own rules in `.cursor/rules/`.

## Tool-Specific Rules

The `.cursor/rules/` directory contains **Cursor-specific rules** that are:

- ✅ Manually managed for Cursor IDE
- ✅ NOT synced from `.github/instructions/`
- ✅ Preserved during init script runs

## Workflow

### Adding a New Command

1. Create `new-command.md` in `.ai/commands/`
2. Run `.ai/apply.sh` to distribute it
3. Verify the output in `.github/prompts/` and `.cursor/commands/`
4. Commit the changes

### Updating an Existing Command

1. Edit the source file in `.ai/commands/`
2. Run `.ai/apply.sh` to sync changes
3. Commit all modified surfaces together

### Aligning All Surfaces

Use the `/rulesalign` command to ensure all instruction surfaces are synchronized:

```
/rulesalign
```

This performs a comprehensive alignment check across:

- `.ai/commands/` - Command definitions
- `.github/instructions/` and `.github/prompts/` - GitHub Copilot
- `.cursor/commands/` and `.cursor/rules/` - Cursor IDE
- `codemaps/` - Project structure documentation

## Framework Documentation

See [`structure.md`](./structure.md) for:

- Instruction surface architecture
- Cross-surface consistency principles
- Command contracts and conventions
- Alignment workflow details

## Best Practices

1. **Keep target directories clean**: Run `apply.sh` when `.cursor/` and `.github/` are clean, or use `--force` if needed
2. **Source of truth**: Edit commands only in `.ai/commands/`
3. **Batch changes**: Commit command updates and their distributions together
4. **Verify**: Review generated files before committing
5. **Document**: Update alignment summary in `structure.md` after changes

## Troubleshooting

### Script fails with "Target directories have uncommitted changes"

You have three options:

**Option 1:** Commit or stash changes in `.cursor/` and `.github/`:

```bash
git add .cursor/ .github/
git commit -m "Update AI surfaces"
.ai/apply.sh
```

**Option 2:** Use the `--force` flag to override:

```bash
.ai/apply.sh --force
```

**Option 3:** Preview changes without modifying files:

```bash
.ai/apply.sh --dry-run
```

### Commands not appearing in editor

After running `apply.sh`, you may need to:

- Reload your editor
- Restart the AI assistant extension
- Clear any cached command lists

### Conflicts between surfaces

Run `/rulesalign` to diagnose and fix inconsistencies across surfaces.
