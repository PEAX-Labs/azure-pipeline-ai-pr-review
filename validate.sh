#!/bin/bash

# Smart Code Reviewer - Validation Script
# This script validates the extension package and build process

set -e

echo "🚀 Smart Code Reviewer - Validation Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

function print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "vss-extension.json" ]; then
    echo -e "${RED}❌ Error: vss-extension.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

print_info "Validating project structure..."

# Check key files exist
echo "📂 Checking project structure..."

required_files=(
    "vss-extension.json"
    "SmartCodeReviewer/task.json"
    "SmartCodeReviewer/package.json"
    "SmartCodeReviewer/tsconfig.json"
    "SmartCodeReviewer/src/index.ts"
    "SmartCodeReviewer/src/review.ts"
    "SmartCodeReviewer/src/pr.ts"
    "SmartCodeReviewer/src/git.ts"
    "SmartCodeReviewer/src/utils.ts"
    "README.md"
    "overview.md"
    "CHANGELOG.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status 0 "Found $file"
    else
        print_status 1 "Missing $file"
    fi
done

print_info "Validating configuration consistency..."

# Extract versions and names from configuration files
VSS_VERSION=$(node -p "require('./vss-extension.json').version")
VSS_NAME=$(node -p "require('./vss-extension.json').name")
VSS_ID=$(node -p "require('./vss-extension.json').id")

TASK_VERSION_MAJOR=$(node -p "require('./SmartCodeReviewer/task.json').version.Major")
TASK_VERSION_MINOR=$(node -p "require('./SmartCodeReviewer/task.json').version.Minor")
TASK_VERSION_PATCH=$(node -p "require('./SmartCodeReviewer/task.json').version.Patch")
TASK_NAME=$(node -p "require('./SmartCodeReviewer/task.json').name")

echo "📋 Configuration Check:"
echo "   VSS Extension: $VSS_NAME v$VSS_VERSION (ID: $VSS_ID)"
echo "   Task: $TASK_NAME v$TASK_VERSION_MAJOR.$TASK_VERSION_MINOR.$TASK_VERSION_PATCH"

# Check naming consistency
if [ "$VSS_ID" = "SmartCodeReviewer" ] && [ "$TASK_NAME" = "SmartCodeReviewer" ]; then
    print_status 0 "Naming consistency check"
else
    print_status 1 "Naming consistency check - VSS ID: $VSS_ID, Task Name: $TASK_NAME"
fi

# Check GitHub URLs
print_info "Validating GitHub URLs..."
REPO_URL="https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review"

VSS_REPO=$(node -p "require('./vss-extension.json').repository.uri")
TASK_HELP=$(node -p "require('./SmartCodeReviewer/task.json').helpMarkDown")

if [[ "$VSS_REPO" == *"PEAX-Labs"* ]]; then
    print_status 0 "VSS extension repository URL updated"
else
    print_status 1 "VSS extension repository URL not updated: $VSS_REPO"
fi

if [[ "$TASK_HELP" == *"PEAX-Labs"* ]]; then
    print_status 0 "Task help URL updated"
else
    print_status 1 "Task help URL not updated: $TASK_HELP"
fi

print_info "Installing dependencies..."

# Install dependencies
cd SmartCodeReviewer
npm install --silent > /dev/null 2>&1
print_status $? "Dependencies installed"

print_info "Building TypeScript..."

# Build TypeScript
npm run build --silent > /dev/null 2>&1
print_status $? "TypeScript compilation"

# Check if dist files were created
if [ -d "dist" ] && [ "$(ls -A dist)" ]; then
    print_status 0 "Build artifacts created"
    echo "   Generated files: $(ls dist | tr '\n' ' ')"
else
    print_status 1 "Build artifacts creation"
fi

cd ..

print_info "Validating task configuration..."

# Check task.json for new features
TASK_JSON="SmartCodeReviewer/task.json"

# Check for new input parameters
required_inputs=("api_key" "model" "ai_endpoint" "max_tokens" "temperature" "ai_instructions" "comment_chunk_size" "skip_files")
missing_inputs=()

for input in "${required_inputs[@]}"; do
    if grep -q "\"name\": \"$input\"" "$TASK_JSON"; then
        echo "   ✅ Input parameter: $input"
    else
        missing_inputs+=("$input")
    fi
done

if [ ${#missing_inputs[@]} -eq 0 ]; then
    print_status 0 "All required input parameters present"
else
    print_status 1 "Missing input parameters: ${missing_inputs[*]}"
fi

# Check for modern Node runtime (Node20_1 or newer)
if grep -q "\"Node20_1\"" "$TASK_JSON" || grep -q "\"Node22\"" "$TASK_JSON"; then
    NODE_VERSION=$(grep -o "\"Node[0-9_]*\"" "$TASK_JSON" | tr -d '"')
    print_status 0 "Modern Node runtime configured ($NODE_VERSION)"
else
    print_status 1 "Modern Node runtime not configured (should be Node20_1 or newer)"
fi

print_info "Validating package configuration..."

# Check package.json for modern dependencies
PKG_JSON="SmartCodeReviewer/package.json"

if grep -q "\"openai\": \"^4" "$PKG_JSON"; then
    print_status 0 "Modern OpenAI SDK version"
else
    print_status 1 "OpenAI SDK version check"
fi

if grep -q "\"minimatch\"" "$PKG_JSON"; then
    print_status 0 "File filtering dependency present"
else
    print_status 1 "Missing file filtering dependency"
fi

print_info "Final validation..."

# Check if we can create the extension package (dry run)
if command -v tfx &> /dev/null; then
    print_info "Testing extension packaging..."
    tfx extension create --manifest-globs vss-extension.json --output-path temp_test_package.vsix > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        print_status 0 "Extension packaging test"
        rm -f temp_test_package.vsix *.vsix 2>/dev/null || true
    else
        print_status 1 "Extension packaging test"
    fi
else
    print_info "⚠️  tfx-cli not installed, skipping packaging test"
    echo "   Install with: npm install -g tfx-cli"
fi

echo ""
echo "🎉 Validation Complete!"
echo "=========================================="
echo "Your Smart Code Reviewer extension is ready for:"
echo "  • Publishing to Azure DevOps Marketplace"
echo "  • Testing in Azure DevOps pipelines"
echo "  • Further development and customization"
echo ""
echo "Next steps:"
echo "  1. Install tfx-cli: npm install -g tfx-cli"
echo "  2. Package extension: npm run package"
echo "  3. Upload to marketplace or install locally"
echo ""
echo "For more information, see:"
echo "  • README.md - Setup and configuration"
echo "  • examples.md - Pipeline configuration examples"
echo "  • CHANGELOG.md - What's new in this version"
