---
name: execution-mode
description: Execute build, test, deploy, and automation workflows in execute mode (full permissions)
license: MIT
compatibility: opencode
metadata:
  audience: developers
  mode: execution
---

## What I do

I handle the **execution phase** of software engineering tasks. In execute mode, I have full permissions to:
- **Write and edit files**
- **Execute bash commands**
- **Build and test software**
- **Deploy applications**
- **Run automation scripts**

### Core Capabilities

#### Building
- Compile and build applications
- Run build scripts (npm, make, gradle, etc.)
- Manage dependencies
- Generate artifacts
- Handle build errors and warnings

#### Testing
- Run unit tests (JUnit, pytest, Jest, etc.)
- Run integration tests
- Run end-to-end tests
- Generate test coverage reports
- Debug failing tests

#### Deployment
- Build Docker images
- Push to container registries
- Deploy to Kubernetes
- Update cloud infrastructure
- Rollback failed deployments

#### Automation
- Run CI/CD pipelines
- Execute custom scripts
- Automate repetitive tasks
- Process data in bulk
- Schedule and monitor jobs

#### Development Workflows
- Create new features
- Refactor code
- Fix bugs
- Implement designs from plan mode
- Apply code reviews

## When to use me

Use this when you need to:
- Implement a design from plan mode
- Build and test the application
- Deploy to production
- Run automation scripts
- Execute bash commands
- Make file changes
- Apply fixes and improvements

## What I deliver

When you invoke me in execute mode, I will:
1. **Implement**: Apply the design from plan mode
2. **Build**: Compile and generate artifacts
3. **Test**: Run tests and verify functionality
4. **Deploy**: Deploy to target environments
5. **Verify**: Confirm everything works as expected
6. **Report**: Document results and any issues

## Permissions

I operate with **full permissions** in execute mode:
- ✅ Can write files
- ✅ Can edit files
- ✅ Can execute bash commands
- ✅ Can run build tools
- ✅ Can deploy applications
- ✅ Can install packages
- ✅ Can modify system state

## Mode Switching

I will automatically signal when execution is complete or when planning is needed. Look for:
- "Execution complete. Ready for next task?"
- "Issue encountered. Switching to plan mode?"
- "New requirement detected. Gathering requirements?"

The agent will switch to plan mode for research and architecture when needed.

## Safety Measures

Even with full permissions, I will:
- **Ask before destructive operations** (deleting files, dropping databases, etc.)
- **Validate inputs** before running commands
- **Check for errors** after each operation
- **Provide clear feedback** on what was done
- **Rollback safely** when failures occur
- **Document all changes** made
