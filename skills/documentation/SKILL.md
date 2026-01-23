---
name: documentation
description: Generate and maintain comprehensive project documentation, APIs, and technical guides
license: MIT
compatibility: opencode
metadata:
  audience: developers
  expertise: documentation
---

## What I do

I provide comprehensive documentation capabilities to ensure your projects are well-documented and maintainable.

### Core Capabilities

#### Project Documentation
- Create and maintain README files
- Write contributing guidelines
- Document project structure
- Explain architecture decisions
- Create installation guides
- Document configuration options

#### API Documentation
- Generate API documentation from code
- Document REST endpoints
- Document GraphQL schemas
- Document gRPC services
- Create API usage examples
- Document request/response formats

#### Code Documentation
- Add and update docstrings
- Document function signatures
- Document class interfaces
- Explain complex algorithms
- Add inline comments where needed
- Document data structures

#### Technical Guides
- Write tutorials and how-to guides
- Create onboarding documentation
- Document workflows and processes
- Explain development setup
- Create troubleshooting guides
- Document best practices

#### Architecture Documentation
- Document system architecture
- Create architecture diagrams (descriptions)
- Explain component interactions
- Document data flow
- Explain design patterns used
- Document technology choices

#### Changelog & Release Notes
- Maintain CHANGELOG files
- Write release notes
- Document breaking changes
- Highlight new features
- Document bug fixes
- Create upgrade guides

## When to use me

Use this when you need to:
- Document a new project
- Update existing documentation
- Create API documentation
- Write technical guides
- Document code changes
- Prepare release notes
- Create onboarding materials
- Explain complex systems

## Documentation Types

### README.md
```markdown
# Project Name

Brief description of what the project does.

## Features
- Feature 1
- Feature 2

## Installation
```bash
npm install project-name
```

## Usage
```javascript
const project = require('project-name');
project.doSomething();
```

## Contributing
Guidelines for contributors.

## License
MIT
```

### API Documentation
```markdown
## API Reference

### GET /api/users

Get all users.

**Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response**:
```json
{
  "users": [...],
  "total": 100
}
```

**Example**:
```bash
curl https://api.example.com/users?page=1&limit=10
```
```

### Code Documentation
```javascript
/**
 * Calculates the sum of two numbers.
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Sum of a and b
 * @throws {Error} If inputs are not numbers
 *
 * @example
 * sum(2, 3); // Returns 5
 */
function sum(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}
```

### Architecture Documentation
```markdown
## System Architecture

### Overview
The system consists of three main components:
1. **API Gateway**: Handles incoming requests
2. **Service Layer**: Business logic
3. **Data Layer**: Database access

### Data Flow
1. Client → API Gateway
2. API Gateway → Service Layer
3. Service Layer → Data Layer
4. Response flows back through layers

### Technology Stack
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Cache**: Redis
```

## Best Practices I Follow

1. **Keep it Current**: Documentation must match code
2. **Be Clear**: Use simple, unambiguous language
3. **Be Concise**: Say more with less
4. **Provide Examples**: Show, don't just tell
5. **Use Formats**: Use markdown, code blocks, tables
6. **Include Diagrams**: Describe visual representations
7. **Version Control**: Document changes in changelog
8. **Accessibility**: Ensure docs are easy to find

## Documentation Standards

### Quality Checklist
- ✅ All public APIs documented
- ✅ README includes installation and usage
- ✅ Contributing guidelines present
- ✅ License documented
- ✅ Changelog maintained
- ✅ Code comments where needed
- ✅ Examples provided
- ✅ Troubleshooting section

### Accessibility
- ✅ Clear navigation
- ✅ Searchable content
- ✅ Organized structure
- ✅ Consistent formatting
- ✅ Cross-references between sections
- ✅ Table of contents for long docs

## What I Deliver

When you invoke me for documentation:
1. **Analyze**: Review code and understand functionality
2. **Structure**: Organize documentation logically
3. **Write**: Create clear, comprehensive docs
4. **Format**: Use appropriate markdown and code blocks
5. **Review**: Ensure accuracy and completeness
6. **Maintain**: Keep docs in sync with code

## Tools and Formats

### Documentation Generators
- **JSDoc**: JavaScript/TypeScript API docs
- **Sphinx**: Python documentation
- **Swagger/OpenAPI**: REST API docs
- **Javadoc**: Java documentation
- **Godoc**: Go documentation

### Static Site Generators
- **GitBook**: Book-style documentation
- **Docusaurus**: React-based docs
- **MkDocs**: Python-based docs
- **Hugo**: Fast static site generator
- **VuePress**: Vue-based docs

## Documentation Structure

```
project/
├── README.md              # Project overview
├── CHANGELOG.md           # Version history
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # License file
├── docs/                  # Documentation folder
│   ├── api/               # API documentation
│   ├── guides/            # User guides
│   ├── architecture/      # Architecture docs
│   └── examples/          # Usage examples
└── code comments          # Inline documentation
```

## Common Documentation Sections

### README
- Project description
- Features
- Installation instructions
- Quick start guide
- Usage examples
- Configuration
- Contributing
- License

### API Docs
- Endpoints
- Parameters
- Request/response formats
- Authentication
- Error codes
- Rate limiting
- Examples

### Architecture
- System overview
- Components
- Data flow
- Technology choices
- Design patterns
- Deployment architecture

## Automation

I can help automate documentation:
- Generate docs from code comments
- Create API documentation automatically
- Update changelogs from git commits
- Generate usage examples from tests
- Keep documentation in sync with code
