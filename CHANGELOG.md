# Changelog - Smart Code Reviewer

All notable changes to the Smart Code Reviewer extension are documented in this file.

## [1.0.0] - 2025-01-22

### 🚀 Major Refactor and Rebranding

This release represents a complete overhaul of the original extension, transforming it from a basic GPT-based reviewer into a comprehensive, enterprise-ready AI code review solution.

#### ✨ New Features

- **🧠 Advanced AI Models**: Default to GPT-4o (latest and most capable model)
- **⚙️ Full Model Customization**: Support for any OpenAI or Azure OpenAI model (not limited to predefined list)
- **💬 Smart Comment Handling**: Automatic chunking to handle Azure DevOps 2048 character limit
- **🎯 Intelligent File Filtering**: Skip generated files, minified code, and other irrelevant files
- **📊 Enhanced Configuration**: Temperature, max tokens, and comprehensive customization options
- **🛡️ Better Error Handling**: Graceful degradation and informative error messages
- **🔧 Improved Default Prompt**: Professional, structured review instructions with emoji indicators

#### 🔄 Breaking Changes

- **Extension Name**: `AIPullRequestReview` → `SmartCodeReviewer`
- **Extension ID**: New unique identifier for marketplace
- **Task Name**: `AIPullRequestReview` → `SmartCodeReviewer`
- **Folder Structure**: `GPTPullRequestReview/` → `SmartCodeReviewer/`
- **Publisher**: Changed to `PEAX-Labs`

#### 🛠️ Technical Improvements

- **Modern Dependencies**: Updated to OpenAI SDK v4.x, latest Azure Pipelines task lib
- **TypeScript Improvements**: Better type safety, modern ES6+ features
- **Node.js Runtime**: Upgraded from Node10 to Node16 for better performance and security
- **API Versioning**: Updated Azure DevOps REST API calls to v7.0
- **Build Process**: Improved build pipeline with better error handling and artifact management

#### 🎨 UI/UX Enhancements

- **Better Input Validation**: Clear error messages and input validation
- **Professional Descriptions**: Improved task descriptions and help text
- **Comprehensive Documentation**: Detailed README, examples, and troubleshooting guides
- **Emoji Indicators**: Visual feedback in review comments (🚨 critical, ⚠️ warning, 💡 suggestion)

#### 🔧 Configuration Changes

**New Parameters:**
- `model`: Free-text field (replaces limited dropdown)
- `max_tokens`: Configurable response length (default: 1500)
- `temperature`: AI response randomness control (default: 0.1)
- `comment_chunk_size`: Control comment splitting (default: 1800)
- `skip_files`: Pattern-based file filtering
- `ai_instructions`: Completely customizable review prompt

**Renamed Parameters:**
- `aoi_endpoint` → `ai_endpoint` (fixed typo)
- `api_key` → Enhanced with better security guidance

**Improved Defaults:**
- Model: `gpt-3.5-turbo` → `gpt-4o`
- Max tokens: `500` → `1500`
- Better default skip patterns for common generated files

#### 🔒 Security & Reliability

- **Enhanced SSL Support**: Better handling of self-signed certificates
- **Improved Authentication**: More robust token handling
- **Error Recovery**: Automatic retry with truncated content for large patches
- **Secure Defaults**: Better guidance on storing API keys securely

#### 📚 Documentation

- **Comprehensive README**: Complete setup and configuration guide
- **Example Configurations**: Multiple real-world pipeline examples
- **Troubleshooting Guide**: Common issues and solutions
- **API Documentation**: Detailed parameter descriptions

#### 🌍 Repository Updates

- **GitHub Links**: Updated all references to new repository URL
- **License**: Maintained MIT license with updated copyright
- **CI/CD**: Improved GitHub Actions workflow
- **Issue Templates**: Better bug reporting and feature request templates

### 📈 Performance Improvements

- **Faster Builds**: Streamlined compilation process
- **Better Memory Usage**: More efficient file processing
- **Reduced Bundle Size**: Optimized dependencies
- **Parallel Processing**: Better handling of multiple file reviews

### 🐛 Bug Fixes

- Fixed comment posting failures with large reviews
- Resolved timeout issues with large codebases
- Improved error handling for network failures
- Fixed Unicode handling in git diffs
- Resolved issues with special characters in file paths

### 🔄 Migration Guide

#### For Users Upgrading from v0.x

1. **Update Extension Reference**: Change task name from `AIPullRequestReview` to `SmartCodeReviewer`
2. **Review Configuration**: The `model` parameter now accepts any string (no longer limited to dropdown)
3. **Check Skip Patterns**: Review and update file skip patterns if needed
4. **API Endpoint**: Update parameter name from `aoi_endpoint` to `ai_endpoint`
5. **Review Prompt**: Consider updating to the new default prompt or customize for your needs

#### Example Migration

**Before (v0.x):**
```yaml
- task: AIPullRequestReview@0
  inputs:
    api_key: '$(OPENAI_API_KEY)'
    model: 'gpt-3.5-turbo'
    aoi_endpoint: '$(AZURE_ENDPOINT)'
```

**After (v1.0):**
```yaml
- task: SmartCodeReviewer@1
  inputs:
    api_key: '$(OPENAI_API_KEY)'
    model: 'gpt-4o'  # or any model you prefer
    ai_endpoint: '$(AZURE_ENDPOINT)'  # note the corrected parameter name
    max_tokens: '2000'  # new parameter
    temperature: '0.1'  # new parameter
```

---

## Previous Versions

### [0.1.17] - Previous Release
- Basic GPT-3.5 integration
- Limited model selection
- Basic prompt support
- Original marketplace listing

---

## Planned Features

### [1.1.0] - Upcoming
- **Integration with Popular Tools**: Support for SonarQube, ESLint integration
- **Custom Rule Engine**: Define organization-specific review rules
- **Review Templates**: Predefined templates for different project types
- **Metrics Dashboard**: Review quality metrics and insights
- **Multi-Language Prompts**: Support for non-English review feedback

### [1.2.0] - Future
- **Team Learning**: AI adapts to team preferences over time
- **Code Quality Scoring**: Numerical quality scores for changes
- **Integration APIs**: Webhook support for external tools
- **Advanced Filtering**: Directory-based and author-based filtering

---

For complete documentation and examples, visit: https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review
