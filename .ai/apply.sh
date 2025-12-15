#!/bin/bash

# AI Assistant Apply Script
# Automates the distribution of commands from .ai/commands/ to appropriate surfaces
# with correct headers and file formats.
#
# Sections marked with INIT: Run only on first install
# Sections marked with INSTALL: Run on subsequent updates

set -e  # Exit on error

# Help function
show_help() {
    cat << EOF
Usage: apply.sh [OPTIONS]

Automates the distribution of AI assistant commands and instructions to all
configured surfaces (GitHub Copilot, Cursor, etc.).

OPTIONS:
    --dry-run, -n    Preview changes without modifying files
    --force, -f      Force run even if target directories have uncommitted changes
    --help, -h       Show this help message

EXAMPLES:
    # Preview what would be changed
    .ai/apply.sh --dry-run

    # Apply changes
    .ai/apply.sh
    
    # Force apply even with uncommitted changes in .cursor or .github
    .ai/apply.sh --force

PROCESS:
    1. Verifies .cursor/, .github/, and .opencode/ directories are clean (unless --force)
    2. [INIT] Creates target directories if needed
    3. [INSTALL] Distributes commands from .ai/commands/ to:
       - .github/prompts/*.prompt.md
       - .cursor/commands/*.md
       - .opencode/command/*.md
    4. [INIT] Copies codemap templates from .ai/data/codemaps/templates/

SOURCE OF TRUTH:
    • Commands: .ai/commands/*.md
    • Instructions: .github/instructions/*.instructions.md (NOT synced by this script)
    • Tool-specific rules: .cursor/rules/ (manually managed)

For more information, see .ai/README.md
EOF
}

# Parse arguments
DRY_RUN=false
FORCE=false
for arg in "$@"; do
    case $arg in
        --dry-run|-n)
            DRY_RUN=true
            shift
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Error: Unknown option: $arg"
            echo "Run 'apply.sh --help' for usage information."
            exit 1
            ;;
    esac
done

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the repository root directory
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${BLUE}  AI Assistant Apply (DRY RUN)${NC}"
else
    echo -e "${BLUE}  AI Assistant Apply${NC}"
fi
if [ "$FORCE" = true ]; then
    echo -e "${YELLOW}  (FORCE MODE: Ignoring uncommitted changes)${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo

# Step 0: Check git status for target directories (ALWAYS RUN)
echo -e "${YELLOW}Step 0: Checking target directories...${NC}"

# Check if .cursor/, .github/, or .opencode/ have uncommitted changes
CURSOR_CHANGES=$(git status --porcelain .cursor/ 2>/dev/null || echo "")
GITHUB_CHANGES=$(git status --porcelain .github/ 2>/dev/null || echo "")
OPENCODE_CHANGES=$(git status --porcelain .opencode/ 2>/dev/null || echo "")

if [[ -n "$CURSOR_CHANGES" || -n "$GITHUB_CHANGES" || -n "$OPENCODE_CHANGES" ]]; then
    if [ "$FORCE" = false ] && [ "$DRY_RUN" = false ]; then
        echo -e "${RED}✗ Target directories have uncommitted changes:${NC}"
        if [[ -n "$CURSOR_CHANGES" ]]; then
            echo -e "${YELLOW}  .cursor/ has changes${NC}"
        fi
        if [[ -n "$GITHUB_CHANGES" ]]; then
            echo -e "${YELLOW}  .github/ has changes${NC}"
        fi
        if [[ -n "$OPENCODE_CHANGES" ]]; then
            echo -e "${YELLOW}  .opencode/ has changes${NC}"
        fi
        echo -e "${YELLOW}  Please commit or stash changes in these directories before running apply.${NC}"
        echo -e "${YELLOW}  Or use --force to override this check, or --dry-run to preview changes.${NC}"
        exit 1
    elif [ "$FORCE" = true ]; then
        echo -e "${YELLOW}⚠ Target directories have uncommitted changes (force mode enabled)${NC}"
        if [[ -n "$CURSOR_CHANGES" ]]; then
            echo -e "${YELLOW}  .cursor/ has changes (will be overwritten)${NC}"
        fi
        if [[ -n "$GITHUB_CHANGES" ]]; then
            echo -e "${YELLOW}  .github/ has changes (will be overwritten)${NC}"
        fi
        if [[ -n "$OPENCODE_CHANGES" ]]; then
            echo -e "${YELLOW}  .opencode/ has changes (will be overwritten)${NC}"
        fi
    elif [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}⚠ Target directories have uncommitted changes (dry run mode)${NC}"
        if [[ -n "$CURSOR_CHANGES" ]]; then
            echo -e "${YELLOW}  .cursor/ has changes${NC}"
        fi
        if [[ -n "$GITHUB_CHANGES" ]]; then
            echo -e "${YELLOW}  .github/ has changes${NC}"
        fi
        if [[ -n "$OPENCODE_CHANGES" ]]; then
            echo -e "${YELLOW}  .opencode/ has changes${NC}"
        fi
    fi
else
    echo -e "${GREEN}✓ Target directories are clean${NC}"
fi

CURRENT_BRANCH=$(git branch --show-current)
echo -e "  Current branch: ${BLUE}${CURRENT_BRANCH}${NC}"
echo

# Step 1: Create target directories if they don't exist (INIT: First install only)
echo -e "${YELLOW}Step 1 [INIT]: Ensuring target directories exist...${NC}"
if [ "$DRY_RUN" = false ]; then
    mkdir -p .github/prompts
    mkdir -p .cursor/commands
    mkdir -p .cursor/rules
    mkdir -p .opencode/command
    echo -e "${GREEN}✓ Target directories verified${NC}"
else
    echo -e "${BLUE}→ Would create: .github/prompts${NC}"
    echo -e "${BLUE}→ Would create: .cursor/commands${NC}"
    echo -e "${BLUE}→ Would create: .cursor/rules${NC}"
    echo -e "${BLUE}→ Would create: .opencode/command${NC}"
fi
echo

# Step 2: Process command files from .ai/commands/ (INSTALL: Subsequent runs)
echo -e "${YELLOW}Step 2 [INSTALL]: Distributing commands from .ai/commands/...${NC}"

if [ ! -d ".ai/commands" ]; then
    echo -e "${RED}✗ Directory .ai/commands/ not found${NC}"
    exit 1
fi

COMMAND_COUNT=0
for cmd_file in .ai/commands/*.md; do
    if [ ! -f "$cmd_file" ]; then
        continue
    fi
    
    COMMAND_COUNT=$((COMMAND_COUNT + 1))
    basename=$(basename "$cmd_file")
    name="${basename%.md}"
    
    echo -e "  ${BLUE}Processing: ${basename}${NC}"
    
    # Read the content (skip if file doesn't exist)
    if [ ! -f "$cmd_file" ]; then
        echo -e "    ${RED}✗ Source file not found${NC}"
        continue
    fi
    
    # GitHub Prompts: Add frontmatter header, keep content, change extension to .prompt.md
    github_target=".github/prompts/${name}.prompt.md"
    if [ "$DRY_RUN" = false ]; then
        echo "---" > "$github_target"
        echo "mode: agent" >> "$github_target"
        echo "---" >> "$github_target"
        echo "" >> "$github_target"
        cat "$cmd_file" >> "$github_target"
        echo -e "    ${GREEN}✓ Synced to .github/prompts/${name}.prompt.md${NC}"
    else
        echo -e "    ${BLUE}→ Would sync to .github/prompts/${name}.prompt.md${NC}"
    fi
    
    # Cursor Commands: Add frontmatter header, keep content
    cursor_target=".cursor/commands/${name}.md"
    if [ "$DRY_RUN" = false ]; then
        echo "---" > "$cursor_target"
        echo "mode: agent" >> "$cursor_target"
        echo "---" >> "$cursor_target"
        echo "" >> "$cursor_target"
        cat "$cmd_file" >> "$cursor_target"
        echo -e "    ${GREEN}✓ Synced to .cursor/commands/${name}.md${NC}"
    else
        echo -e "    ${BLUE}→ Would sync to .cursor/commands/${name}.md${NC}"
    fi
    
    # OpenCode Commands: Copy content and append arguments placeholder
    opencode_target=".opencode/command/${name}.md"
    if [ "$DRY_RUN" = false ]; then
        cat "$cmd_file" > "$opencode_target"
        echo "" >> "$opencode_target"
        echo "---" >> "$opencode_target"
        echo "<!-- Ignore section if arguments are not replaced -->" >> "$opencode_target"
        echo "<userinput>" >> "$opencode_target"
        echo "\$ARGUMENTS" >> "$opencode_target"
        echo "</userinput>" >> "$opencode_target"
        echo -e "    ${GREEN}✓ Synced to .opencode/command/${name}.md${NC}"
    else
        echo -e "    ${BLUE}→ Would sync to .opencode/command/${name}.md${NC}"
    fi
    
done

if [ $COMMAND_COUNT -eq 0 ]; then
    echo -e "${YELLOW}  No command files found in .ai/commands/${NC}"
else
    echo -e "${GREEN}✓ Distributed ${COMMAND_COUNT} command(s)${NC}"
fi
echo

# Step 3: Copy codemap templates (INIT: First install only)
echo -e "${YELLOW}Step 3 [INIT]: Copying codemap templates...${NC}"

if [ ! -d ".ai/data/codemaps/templates" ]; then
    echo -e "${RED}✗ Directory .ai/data/codemaps/templates/ not found${NC}"
else
    if [ "$DRY_RUN" = false ]; then
        mkdir -p codemaps/templates
        echo -e "${GREEN}✓ Target directory codemaps/templates/ verified${NC}"
    else
        echo -e "${BLUE}→ Would create: codemaps/templates${NC}"
    fi
    
    TEMPLATE_COUNT=0
    for template_file in .ai/data/codemaps/templates/*; do
        if [ ! -f "$template_file" ]; then
            continue
        fi
        
        TEMPLATE_COUNT=$((TEMPLATE_COUNT + 1))
        basename=$(basename "$template_file")
        
        echo -e "  ${BLUE}Processing: ${basename}${NC}"
        
        target="codemaps/templates/${basename}"
        if [ "$DRY_RUN" = false ]; then
            cp "$template_file" "$target"
            echo -e "    ${GREEN}✓ Copied to codemaps/templates/${basename}${NC}"
        else
            echo -e "    ${BLUE}→ Would copy to codemaps/templates/${basename}${NC}"
        fi
    done
    
    if [ $TEMPLATE_COUNT -eq 0 ]; then
        echo -e "${YELLOW}  No template files found in .ai/data/codemaps/templates/${NC}"
    else
        echo -e "${GREEN}✓ Copied ${TEMPLATE_COUNT} template(s)${NC}"
    fi
fi
echo

# Step 4: Summary (ALWAYS RUN)
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "${GREEN}✓ Dry run complete! No files were modified.${NC}"
else
    echo -e "${GREEN}✓ Apply complete!${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo
echo -e "${YELLOW}Summary:${NC}"
if [ "$DRY_RUN" = true ]; then
    echo -e "  • Would distribute ${COMMAND_COUNT} command(s) from .ai/commands/"
    echo -e "  • Would copy ${TEMPLATE_COUNT:-0} template(s) from .ai/data/codemaps/templates/"
else
    echo -e "  • Distributed ${COMMAND_COUNT} command(s) from .ai/commands/"
    echo -e "  • Copied ${TEMPLATE_COUNT:-0} template(s) from .ai/data/codemaps/templates/"
fi
echo
echo -e "${YELLOW}Distribution Mapping:${NC}"
echo -e "  ${BLUE}Commands:${NC}"
echo -e "    .ai/commands/<name>.md"
echo -e "      ├─→ .github/prompts/<name>.prompt.md (+ frontmatter)"
echo -e "      ├─→ .cursor/commands/<name>.md (+ frontmatter)"
echo -e "      └─→ .opencode/command/<name>.md"
echo
echo -e "  ${BLUE}Codemap Templates:${NC}"
echo -e "    .ai/data/codemaps/templates/<template>"
echo -e "      └─→ codemaps/templates/<template>"
echo
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Run without --dry-run to apply changes: ${BLUE}.ai/apply.sh${NC}"
    echo -e "  2. Or review the command files in .ai/commands/"
else
    echo -e "${YELLOW}Next Steps:${NC}"
    echo -e "  1. Review the changes: ${BLUE}git status${NC}"
    echo -e "  2. Verify the synced files look correct"
    echo -e "  3. Commit the changes to branch: ${BLUE}${CURRENT_BRANCH}${NC}"
fi
echo
echo -e "${YELLOW}Note:${NC}"
echo -e "  • This script treats .ai/commands/*.md as the source of truth"
echo -e "  • Instructions in .github/instructions/ are used by GitHub Copilot only"
echo -e "  • Cursor-specific rules are manually managed in .cursor/rules/"
echo -e "  • Sections marked [INIT] should only run on first install"
echo -e "  • Sections marked [INSTALL] run on subsequent updates"
if [ "$DRY_RUN" = true ]; then
    echo -e "  • Run ${BLUE}.ai/apply.sh${NC} without --dry-run to apply changes"
fi
echo

