---
name: code-review
description: Code quality analysis, best practices enforcement, and improvement recommendations
license: MIT
compatibility: opencode
metadata:
  audience: developers
  expertise: code-quality
---

## What I do

I provide comprehensive code review capabilities to ensure high-quality, maintainable, and secure code.

### Core Capabilities

#### Code Quality Assessment
- Analyze code structure and organization
- Identify code smells and anti-patterns
- Check for proper naming conventions
- Evaluate code complexity (cyclomatic complexity)
- Assess code duplication
- Review error handling

#### Security Review
- Identify security vulnerabilities
- Check for input validation
- Review authentication and authorization
- Detect SQL injection risks
- Identify XSS vulnerabilities
- Check for hardcoded secrets
- Review dependency vulnerabilities

#### Performance Analysis
- Identify performance bottlenecks
- Review algorithm efficiency
- Check for N+1 query problems
- Identify memory leaks
- Review caching strategies
- Analyze database query efficiency
- Check for unnecessary computations

#### Best Practices Enforcement
- Enforce language-specific best practices
- Review SOLID principles adherence
- Check DRY (Don't Repeat Yourself)
- Review design patterns usage
- Ensure proper separation of concerns
- Review API design
- Check for proper error handling

#### Testing Review
- Review test coverage
- Check test quality and effectiveness
- Identify missing test cases
- Review test design patterns
- Ensure test isolation
- Check for flaky tests

#### Documentation Review
- Review code comments
- Check docstring completeness
- Ensure API documentation
- Review README accuracy
- Check for outdated documentation
- Review inline comments necessity

## When to use me

Use this when you need to:
- Review a pull request
- Analyze existing codebase quality
- Identify technical debt
- Prepare for a code review meeting
- Improve code maintainability
- Enhance code security
- Optimize performance
- Ensure best practices compliance

## What I Check For

### General
- ✅ Clean, readable code
- ✅ Consistent formatting
- ✅ Meaningful variable names
- ✅ Appropriate comments
- ✅ Proper error handling
- ✅ No magic numbers
- ✅ Avoid code duplication

### Security
- ✅ No hardcoded credentials
- ✅ Input validation
- ✅ Output encoding
- ✅ Parameterized queries
- ✅ Proper authentication
- ✅ Authorization checks
- ✅ Secure dependencies

### Performance
- ✅ Efficient algorithms
- ✅ Proper indexing
- ✅ Lazy loading
- ✅ Caching strategies
- ✅ Resource cleanup
- ✅ Avoid premature optimization

### Maintainability
- ✅ Single Responsibility
- ✅ Open/Closed Principle
- ✅ DRY principle
- ✅ Small functions
- ✅ Minimal complexity
- ✅ Clear interfaces

## Code Review Checklist

### Functionality
- [ ] Does the code meet requirements?
- [ ] Are edge cases handled?
- [ ] Is error handling appropriate?
- [ ] Are assumptions documented?

### Readability
- [ ] Are names descriptive?
- [ ] Is code well-structured?
- [ ] Are comments helpful?
- [ ] Is complex logic explained?

### Security
- [ ] Are inputs validated?
- [ ] Are outputs encoded?
- [ ] Are secrets secure?
- [ ] Are dependencies up to date?

### Performance
- [ ] Is the algorithm efficient?
- [ ] Are database queries optimized?
- [ ] Is memory usage appropriate?
- [ ] Are resources cleaned up?

### Testing
- [ ] Are tests comprehensive?
- [ ] Do tests pass?
- [ ] Is coverage adequate?
- [ ] Are edge cases tested?

## What I Deliver

When you invoke me for code review:
1. **Analyze**: Review the code comprehensively
2. **Identify**: Highlight issues and improvements
3. **Prioritize**: Rate issues by severity
4. **Recommend**: Provide specific solutions
5. **Explain**: Document reasoning
6. **Score**: Provide an overall quality score

## Severity Levels

### Critical (Must Fix)
- Security vulnerabilities
- Data corruption risks
- Performance breaking issues
- Crashes or data loss

### High (Should Fix)
- Significant security issues
- Performance problems
- Major maintainability issues
- Broken functionality

### Medium (Nice to Fix)
- Code smells
- Minor security issues
- Performance optimizations
- Documentation gaps

### Low (Optional)
- Style inconsistencies
- Minor optimizations
- Enhanced documentation
- Refactoring opportunities

## Feedback Format

I provide structured feedback:

```markdown
## Issue: [Title]

**Severity**: [Critical/High/Medium/Low]
**Location**: [File:Line]
**Category**: [Security/Performance/Quality/Style]

### Problem
[Description of the issue]

### Example
```language
// Problematic code
```

### Recommendation
[Suggested fix]

### Impact
[Why this matters]

```

## Tools Integration

I can use tools like:
- **ESLint**: JavaScript/TypeScript linting
- **Pylint**: Python linting
- **SonarQube**: Code quality analysis
- **Security scanners**: Dependency check, Snyk
- **Coverage tools**: Coverage.py, Istanbul

## Best Practices

When reviewing code, I:
1. **Be Constructive**: Focus on improvement, not criticism
2. **Explain Why**: Provide context for suggestions
3. **Offer Solutions**: Don't just point out problems
4. **Respect Style**: Adapt to team conventions
5. **Prioritize**: Focus on critical issues first
6. **Learn**: Share knowledge and techniques
