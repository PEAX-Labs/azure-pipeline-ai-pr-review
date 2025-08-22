# Smart Code Reviewer - Example Pipeline Configuration

This document provides example configurations for using the Smart Code Reviewer extension in your Azure DevOps pipelines.

## Basic YAML Pipeline Example

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: 'AI-Review-Config'  # Contains OPENAI_API_KEY

jobs:
- job: BuildAndReview
  displayName: 'Build and AI Code Review'
  
  steps:
  # Checkout with persistent credentials for PR comments
  - checkout: self
    persistCredentials: true
    
  # Your build steps here
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
    displayName: 'Install Node.js'
    
  - script: |
      npm install
      npm run build
      npm test
    displayName: 'Build and Test'
    
  # AI Code Review (only runs for PRs)
  - task: SmartCodeReviewer@1
    displayName: 'AI Code Review'
    condition: eq(variables['Build.Reason'], 'PullRequest')
    inputs:
      api_key: '$(OPENAI_API_KEY)'
      model: 'gpt-4o'
      max_tokens: '2000'
      temperature: '0.1'
```

## Advanced Configuration Examples

### Security-Focused Review

```yaml
- task: SmartCodeReviewer@1
  displayName: 'Security-Focused AI Review'
  inputs:
    api_key: '$(OPENAI_API_KEY)'
    model: 'gpt-4o'
    max_tokens: '2500'
    temperature: '0.05'  # More deterministic for security reviews
    skip_files: |
      *.min.js
      *.bundle.js
      package-lock.json
      node_modules/**/*
      dist/**/*
      build/**/*
    ai_instructions: |
      You are a cybersecurity expert conducting a thorough security review. Focus exclusively on:
      
      🛡️ **Critical Security Issues**
      - SQL injection vulnerabilities
      - XSS (Cross-Site Scripting) risks
      - Authentication/authorization bypasses
      - Sensitive data exposure
      - Insecure cryptographic practices
      - Input validation flaws
      
      🔍 **Code Patterns to Flag**
      - Direct database queries without parameterization
      - User input used in eval() or similar functions
      - Hardcoded secrets, passwords, or API keys
      - Unsafe deserialization
      - Missing CSRF protection
      - Improper error handling that leaks information
      
      **Response Format:**
      - Use 🚨 for critical security vulnerabilities
      - Use ⚠️ for potential security concerns
      - Provide specific remediation steps
      - If no security issues: "No security vulnerabilities detected ✅"
      - Include OWASP references where applicable
```

### Performance & Architecture Review

```yaml
- task: SmartCodeReviewer@1
  displayName: 'Performance & Architecture Review'
  inputs:
    api_key: '$(OPENAI_API_KEY)'
    model: 'gpt-4o'
    max_tokens: '2000'
    ai_instructions: |
      You are a senior software architect reviewing code for performance and design quality. Focus on:
      
      🚀 **Performance Analysis**
      - Algorithm efficiency (time/space complexity)
      - Database query optimization
      - Caching strategies
      - Memory leaks and resource management
      - Async/await patterns
      
      🏗️ **Architecture & Design**
      - SOLID principles adherence
      - Design patterns usage
      - Code coupling and cohesion
      - Separation of concerns
      - API design quality
      
      💡 **Optimization Opportunities**
      - Code duplication elimination
      - Refactoring suggestions
      - Library/framework best practices
      
      **Scoring:** Rate performance impact as HIGH/MEDIUM/LOW and provide specific optimization suggestions.
```

### Azure OpenAI Configuration

```yaml
variables:
  - group: 'Azure-AI-Config'  # Contains AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT

steps:
- task: SmartCodeReviewer@1
  displayName: 'Azure OpenAI Code Review'
  inputs:
    api_key: '$(AZURE_OPENAI_KEY)'
    ai_endpoint: '$(AZURE_OPENAI_ENDPOINT)'  # e.g., https://your-resource.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2024-02-15-preview
    max_tokens: '1500'
    temperature: '0.1'
```

### Multi-Language Project Configuration

```yaml
- task: SmartCodeReviewer@1
  displayName: 'Multi-Language AI Review'
  inputs:
    api_key: '$(OPENAI_API_KEY)'
    model: 'gpt-4o'
    skip_files: |
      # JavaScript/TypeScript
      *.min.js
      *.bundle.js
      package-lock.json
      yarn.lock
      node_modules/**/*
      
      # Python
      __pycache__/**/*
      *.pyc
      *.pyo
      *.egg-info/**/*
      
      # .NET
      bin/**/*
      obj/**/*
      *.dll
      *.exe
      
      # Java
      *.class
      *.jar
      target/**/*
      
      # General
      *.generated.*
      *.designer.*
      *.min.*
    ai_instructions: |
      You are a polyglot senior developer reviewing code across multiple languages. Adapt your review style based on the file extension:
      
      **For .js/.ts files:** Focus on async patterns, TypeScript types, and Node.js best practices
      **For .py files:** Focus on PEP 8, type hints, and Python idioms
      **For .cs files:** Focus on C# conventions, LINQ usage, and .NET best practices
      **For .java files:** Focus on Java conventions, design patterns, and performance
      
      Always consider:
      - Language-specific best practices
      - Framework conventions
      - Security implications
      - Performance characteristics
      - Code maintainability
```

### Custom Comment Chunking

```yaml
- task: SmartCodeReviewer@1
  displayName: 'AI Review with Custom Chunking'
  inputs:
    api_key: '$(OPENAI_API_KEY)'
    model: 'gpt-4o'
    max_tokens: '3000'  # Larger responses
    comment_chunk_size: '1600'  # Smaller chunks to ensure they fit in Azure DevOps
    ai_instructions: |
      Provide detailed, comprehensive code reviews. Break down your feedback into clear sections:
      
      ## 🔍 Code Quality
      [Quality feedback here]
      
      ## 🛡️ Security
      [Security feedback here]
      
      ## 🚀 Performance
      [Performance feedback here]
      
      ## 📚 Best Practices
      [Best practices feedback here]
      
      Use markdown formatting, code examples, and specific line references.
```

## Variable Group Setup

Create a variable group named "AI-Review-Config" with these variables:

| Variable Name | Value | Secret |
|---------------|-------|--------|
| OPENAI_API_KEY | your-openai-api-key | ✅ |
| AZURE_OPENAI_KEY | your-azure-openai-key | ✅ |
| AZURE_OPENAI_ENDPOINT | your-azure-endpoint-url | ❌ |

## Classic Pipeline Configuration

For classic (visual) pipelines:

1. Add the Smart Code Reviewer task to your pipeline
2. Configure inputs in the task UI
3. Enable "Allow scripts to access the OAuth token" in Agent job settings
4. Link your variable group containing API keys

## Conditional Execution

Only run AI reviews for specific conditions:

```yaml
# Only for PR builds
- task: SmartCodeReviewer@1
  condition: eq(variables['Build.Reason'], 'PullRequest')

# Only for specific branches
- task: SmartCodeReviewer@1
  condition: and(eq(variables['Build.Reason'], 'PullRequest'), in(variables['System.PullRequest.TargetBranch'], 'refs/heads/main', 'refs/heads/develop'))

# Only for files in specific directories
- task: SmartCodeReviewer@1
  inputs:
    skip_files: |
      !src/**/*
      !lib/**/*
      # This configuration will only review files in src/ and lib/ directories
```

## Troubleshooting Examples

### Debug Configuration

```yaml
- task: SmartCodeReviewer@1
  inputs:
    api_key: '$(OPENAI_API_KEY)'
    model: 'gpt-4o'
    support_self_signed_certificate: true  # For self-hosted agents
  env:
    SYSTEM_DEBUG: true  # Enable verbose logging
```

### Error Handling

```yaml
- task: SmartCodeReviewer@1
  inputs:
    api_key: '$(OPENAI_API_KEY)'
    model: 'gpt-4o'
  continueOnError: true  # Don't fail the build if AI review fails
  condition: succeededOrFailed()  # Run even if previous steps failed
```

This comprehensive configuration guide should help users get the most out of the Smart Code Reviewer extension!
