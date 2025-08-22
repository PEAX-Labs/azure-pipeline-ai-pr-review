# Smart Code Reviewer - AI-Powered Pull Request Reviews

Transform your code review process with intelligent AI analysis that helps maintain code quality, security, and best practices across your development team.

## 🚀 What is Smart Code Reviewer?

Smart Code Reviewer is an advanced Azure DevOps extension that automatically analyzes Pull Requests using state-of-the-art AI models like GPT-4o. It provides comprehensive feedback on code quality, security vulnerabilities, performance issues, and architectural improvements.

## ✨ Key Features

- **🧠 Advanced AI Models**: Support for latest OpenAI models (GPT-4o, GPT-4-turbo) and Azure OpenAI
- **🔍 Comprehensive Analysis**: Reviews code quality, security, architecture, and testing practices
- **⚙️ Fully Customizable**: Configure AI instructions, models, and review parameters to match your team's standards
- **💬 Smart Comments**: Automatic comment chunking handles Azure DevOps character limits
- **🎯 Intelligent Filtering**: Skip minified files, generated code, and other irrelevant files
- **🌍 Cross-Platform**: Works on all Azure DevOps build agents (Linux, Windows, macOS)

## 🎯 Perfect For

- **Development Teams** wanting to maintain consistent code quality
- **Security-Conscious Organizations** needing automated security reviews
- **Fast-Moving Projects** requiring quick, thorough code feedback
- **Educational Environments** helping developers learn best practices

## 🔧 Quick Setup

### 1. Grant Permissions

Ensure your build service can contribute to pull requests:

![contribute_to_pr](https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review/blob/main/images/contribute_to_pr.png?raw=true)

### 2. Enable Token Access

#### For YAML Pipelines

```yaml
steps:
- checkout: self
  persistCredentials: true
```

#### For Classic Pipelines

Enable "Allow scripts to access the OAuth token" in Agent job properties:

![allow_access_token](https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review/blob/main/images/allow_access_token.png?raw=true)

### 3. Configure Your Pipeline

```yaml
steps:
- task: SmartCodeReviewer@1
  inputs:
    api_key: '$(OPENAI_API_KEY)'  # Store securely in variable groups
    model: 'gpt-4o'               # Latest and most capable model
```

## 🎨 Customization Examples

### Security-Focused Reviews
```yaml
ai_instructions: |
  Focus on security vulnerabilities:
  - SQL injection risks
  - XSS vulnerabilities  
  - Authentication bypasses
  - Data exposure issues
  Provide specific fixes for any issues found.
```

### Performance-Oriented Analysis
```yaml
ai_instructions: |
  Analyze code for performance implications:
  - Algorithm efficiency
  - Database query optimization
  - Memory usage patterns
  - Caching opportunities
  Rate the performance impact of changes.
```

## 🌐 Azure OpenAI Support

Enterprise customers can use Azure OpenAI for enhanced security and compliance:

```yaml
- task: SmartCodeReviewer@1
  inputs:
    api_key: '$(AZURE_OPENAI_KEY)'
    ai_endpoint: 'https://your-resource.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview'
```

## 📊 Review Quality

Our AI provides actionable feedback with:

- 🚨 **Critical Issues**: Security vulnerabilities, breaking changes
- ⚠️ **Warnings**: Code smells, potential bugs
- 💡 **Suggestions**: Performance improvements, best practices
- ✅ **Approvals**: Clean code confirmation

## 🛡️ Enterprise Ready

- **Secure**: API keys stored in Azure DevOps variable groups
- **Scalable**: Handles large codebases with intelligent chunking
- **Compliant**: Works with self-signed certificates and private networks
- **Reliable**: Comprehensive error handling and retry logic

## 🚀 Getting Started

1. **Install** the extension from Azure DevOps Marketplace
2. **Configure** your API key in a secure variable group
3. **Add** the task to your pipeline
4. **Customize** the AI instructions for your team's needs
5. **Watch** as AI provides intelligent code reviews automatically

## 📈 Benefits

- **Faster Reviews**: Instant AI feedback reduces review turnaround time
- **Consistent Quality**: Standardized review criteria across all pull requests
- **Knowledge Sharing**: AI explanations help developers learn best practices
- **Early Detection**: Catch issues before they reach production
- **Team Productivity**: Focus human reviewers on architecture and business logic

## 🔗 Learn More

- [GitHub Repository](https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review)
- [Configuration Guide](https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review#configuration-options)
- [Troubleshooting](https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review#troubleshooting)

---

**Ready to revolutionize your code review process?** Install Smart Code Reviewer today and experience the future of automated code quality assurance.

