# Smart Code Reviewer - AI-Powered Pull Request Reviews for Azure DevOps

An intelligent Azure DevOps extension that provides comprehensive AI-powered code reviews using advanced language models like GPT-4, helping teams maintain code quality and catch issues early.

## 🚀 Features

- **Advanced AI Models**: Support for latest OpenAI models (GPT-4o, GPT-4-turbo) and Azure OpenAI
- **Intelligent Reviews**: Comprehensive analysis covering code quality, security, architecture, and testing
- **Fully Customizable**: Configure AI instructions, models, and review parameters
- **Smart Comment Handling**: Automatic comment chunking to handle Azure DevOps character limits
- **File Filtering**: Skip files based on patterns (minified files, generated files, etc.)
- **Cross-Platform**: Works on all Azure DevOps build agents (Linux, Windows, macOS)

## 📦 Installation

Install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=PEAX-Labs.SmartCodeReviewer) (coming soon).

## 🔧 Setup

### 1. Enable Build Service Permissions

The build service needs permission to contribute to pull requests:

1. Go to Project Settings → Repositories → [Your Repository] → Security
2. Find "[Project] Build Service" account
3. Set "Contribute to pull requests" to **Allow**

![contribute_to_pr](https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review/blob/main/images/contribute_to_pr.png?raw=true)

### 2. Allow Task to Access System Token

#### For YAML Pipelines

Add a checkout section with `persistCredentials: true`:

```yaml
steps:
- checkout: self
  persistCredentials: true
```

#### For Classic Pipelines

Enable "Allow scripts to access the OAuth token" in Agent job properties:

![allow_access_token](https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review/blob/main/images/allow_access_token.png?raw=true)

### 3. Configure API Keys

Securely store your OpenAI or Azure OpenAI API key in Azure DevOps:

1. Go to Pipelines → Library → Variable groups
2. Create a new variable group (e.g., "AI-Review-Config")
3. Add variable: `OPENAI_API_KEY` (mark as secret)
4. Link the variable group to your pipeline

## 🎯 Usage

### Basic Configuration

```yaml
steps:
- task: SmartCodeReviewer@1
  inputs:
    api_key: '$(OPENAI_API_KEY)'
    model: 'gpt-4o'  # Latest and most capable model
```

### Advanced Configuration

```yaml
steps:
- task: SmartCodeReviewer@1
  inputs:
    api_key: '$(OPENAI_API_KEY)'
    model: 'gpt-4o'
    max_tokens: '2000'
    temperature: '0.1'
    skip_files: |
      *.min.js
      *.bundle.js
      package-lock.json
      dist/**/*
    ai_instructions: |
      You are a senior software engineer reviewing code for security, performance, and maintainability.
      Focus on:
      - Security vulnerabilities
      - Performance issues
      - Code smells
      - Best practices
      Provide constructive feedback with specific examples.
```

### Azure OpenAI Configuration

```yaml
steps:
- task: SmartCodeReviewer@1
  inputs:
    api_key: '$(AZURE_OPENAI_KEY)'
    ai_endpoint: 'https://your-resource.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview'
```

## ⚙️ Configuration Options

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `api_key` | OpenAI or Azure OpenAI API key | - | ✅ |
| `model` | AI model to use | `gpt-4o` | ❌ |
| `ai_endpoint` | Azure OpenAI endpoint URL | - | ❌ |
| `max_tokens` | Maximum tokens for AI response | `1500` | ❌ |
| `temperature` | AI response randomness (0.0-2.0) | `0.1` | ❌ |
| `comment_chunk_size` | Max characters per comment | `1800` | ❌ |
| `skip_files` | File patterns to skip (one per line) | See defaults | ❌ |
| `ai_instructions` | Custom AI review prompt | See defaults | ❌ |
| `support_self_signed_certificate` | Allow self-signed SSL certificates | `false` | ❌ |

## 🎨 Customizing Review Instructions

The default AI prompt can be customized to match your team's standards:

```yaml
ai_instructions: |
  You are a code reviewer focusing on our team's standards:
  
  🔍 **Code Quality**
  - Follow our TypeScript style guide
  - Ensure proper error handling
  - Check for performance implications
  
  🛡️ **Security**
  - Validate all user inputs
  - Check for SQL injection risks
  - Verify authentication/authorization
  
  🏗️ **Architecture**
  - Maintain clean architecture patterns
  - Ensure proper separation of concerns
  - Follow SOLID principles
  
  **Response Format**:
  - Use emojis: 🚨 (critical), ⚠️ (warning), 💡 (suggestion)
  - If no issues: "Code looks good! ✅"
  - Provide specific examples and fixes
```

## 🎯 Supported Models

### OpenAI Models
- `gpt-4o` (recommended) - Latest, most capable model
- `gpt-4o-mini` - Faster, cost-effective option
- `gpt-4-turbo` - Previous generation, still very capable
- `gpt-3.5-turbo` - Legacy model (not recommended)

### Custom Models
You can specify any model name that your OpenAI or Azure OpenAI deployment supports.

## 🔍 Example Review Output

The AI provides detailed, actionable feedback:

```markdown
🚨 **Security Issue - SQL Injection Risk**
Line 23: Direct string concatenation in SQL query is vulnerable to injection attacks.

**Current:**
```sql
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**Recommended:**
```sql
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);
```

💡 **Performance Suggestion**
Consider adding an index on the `email` column for faster lookups in the user authentication flow.

⚠️ **Code Quality**
The `processUserData` function is doing too many things. Consider breaking it into smaller, focused functions following the Single Responsibility Principle.
```

## 🛠️ Troubleshooting

### Common Issues

1. **"No API Key provided"**
   - Ensure your API key variable is properly configured and accessible in the pipeline

2. **"Failed to add comment"**
   - Check that the build service has "Contribute to pull requests" permission
   - Verify the OAuth token is accessible to the task

3. **"Context length exceeded"**
   - The patch is too large; the task will automatically retry with truncated content
   - Consider using a model with larger context window (gpt-4-turbo)

4. **SSL Certificate Issues**
   - Enable `support_self_signed_certificate: true` for self-hosted environments

### Debug Mode

Enable verbose logging by setting the `system.debug` variable to `true` in your pipeline.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🔗 Links

- [GitHub Repository](https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review)
- [Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=PEAX-Labs.SmartCodeReviewer) (coming soon)
- [Issues & Support](https://github.com/PEAX-Labs/azure-pipeline-ai-pr-review/issues)

---

Built with ❤️ by PEAX Labs
