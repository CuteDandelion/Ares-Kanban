---
name: troubleshooting-debugging
description: Systematic debugging, issue diagnosis, log analysis, and problem resolution
license: MIT
compatibility: opencode
metadata:
  audience: developers
  expertise: debugging
---

## What I do

I provide systematic troubleshooting and debugging capabilities to identify and resolve issues efficiently.

### Core Capabilities

#### Issue Diagnosis
- Analyze error messages and stack traces
- Identify root causes systematically
- Reproduce issues reliably
- Narrow down problem scope
- Isolate failure points
- Understand error context

#### Log Analysis
- Parse and analyze log files
- Find error patterns
- Correlate events across logs
- Analyze log levels and severity
- Search for specific keywords
- Timeline reconstruction

#### Debugging Strategies
- Binary search debugging (bisecting)
- Rubber duck debugging
- Print debugging
- Interactive debugging (breakpoints)
- Conditional breakpoints
- Watch expressions
- Call stack analysis

#### Root Cause Analysis
- Five Whys technique
- Fishbone diagrams (described)
- Timeline analysis
- Dependency analysis
- State machine debugging
- Concurrency issue detection

#### Performance Debugging
- Identify performance bottlenecks
- Analyze slow operations
- Find memory leaks
- Detect resource exhaustion
- Profile CPU usage
- Analyze I/O patterns

#### Network Debugging
- Analyze network requests/responses
- Check connectivity issues
- Inspect headers and payloads
- DNS resolution debugging
- SSL/TLS certificate issues
- Proxy and firewall issues

#### Database Debugging
- Analyze slow queries
- Check connection issues
- Identify deadlocks
- Analyze query execution plans
- Review transaction issues
- Check for constraint violations

## When to use me

Use this when you need to:
- Debug a bug or error
- Investigate a crash
- Troubleshoot a slow application
- Analyze logs for issues
- Reproduce and fix bugs
- Understand why something is broken
- Diagnose system issues
- Resolve deployment problems

## Debugging Methodology

### 1. Understand the Problem
- What is the expected behavior?
- What is the actual behavior?
- When does it occur?
- How often does it occur?
- What changed recently?

### 2. Reproduce the Issue
- Create minimal reproducible example
- Identify reproduction steps
- Document prerequisites
- Note environmental conditions

### 3. Isolate the Cause
- Narrow down the scope
- Test individual components
- Eliminate variables
- Use systematic elimination
- Apply divide and conquer

### 4. Formulate Hypotheses
- Brainstorm possible causes
- Prioritize hypotheses by likelihood
- Test each hypothesis
- Document findings

### 5. Fix and Verify
- Apply the fix
- Test the fix thoroughly
- Ensure no regressions
- Add tests to prevent recurrence

### 6. Document
- Document the root cause
- Explain the fix
- Note lessons learned
- Update documentation

## Debugging Tools

### Log Analysis
```bash
# Search for errors in logs
grep -i "error" /var/log/app.log
grep -i "exception" app.log | tail -20

# Follow logs in real-time
tail -f /var/log/app.log

# Filter by time range
awk '/2025-01-22 10:00/,/2025-01-22 11:00/' app.log

# Count error occurrences
grep -c "ERROR" app.log
```

### Network Debugging
```bash
# Test connectivity
ping example.com
curl -v https://api.example.com

# DNS debugging
nslookup example.com
dig example.com

# Check ports
netstat -tuln | grep 8080
lsof -i :8080

# Network capture
tcpdump -i eth0 -w capture.pcap
```

### Process Debugging
```bash
# Check running processes
ps aux | grep node
top -p <PID>

# Check process details
strace -p <PID>
ltrace -p <PID>

# Check memory usage
pmap <PID>
```

### Database Debugging
```bash
# PostgreSQL
psql -c "SELECT * FROM pg_stat_activity;"
psql -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC;"

# MySQL
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;
```

## Common Error Patterns

### Error Analysis
- **NullPointerException/NoneType**: Missing null checks
- **Connection Refused**: Service not running or wrong port
- **Timeout**: Network issue or slow service
- **404 Not Found**: Incorrect URL or missing resource
- **500 Internal Server Error**: Unhandled exception
- **Out of Memory**: Memory leak or inefficient code
- **Deadlock**: Circular lock dependency

### Log Patterns
- Look for errors preceding the issue
- Check for warnings that might be relevant
- Correlate events across services
- Look for timing patterns
- Check for repeated failures

## Debugging Techniques

### Binary Search (Bisecting)
1. Identify the range where issue occurs
2. Test the midpoint
3. Narrow down the range
4. Repeat until found

### Rubber Duck Debugging
- Explain the problem out loud
- Describe the code line by line
- Explain expected vs actual behavior
- Often reveals the issue through explanation

### Divide and Conquer
1. Break system into components
2. Test each component independently
3. Isolate the failing component
4. Deep dive into that component

### Minimal Reproducible Example
- Remove unnecessary code
- Simplify data
- Eliminate dependencies
- Use hardcoded values
- Make it self-contained

## Root Cause Analysis

### Five Whys
1. Why did this happen? → Answer 1
2. Why did Answer 1 happen? → Answer 2
3. Why did Answer 2 happen? → Answer 3
4. Why did Answer 3 happen? → Answer 4
5. Why did Answer 4 happen? → Root cause

### Fishbone Diagram (Ishikawa)
Categories to consider:
- **People**: Training, experience, communication
- **Process**: Procedures, workflows, protocols
- **Machine**: Equipment, tools, hardware
- **Materials**: Resources, data, inputs
- **Environment**: Conditions, constraints, external factors
- **Methods**: Techniques, approaches, algorithms

## What I Deliver

When you invoke me for troubleshooting:
1. **Understand**: Gather information about the issue
2. **Reproduce**: Create reproducible scenario
3. **Analyze**: Examine logs, errors, and code
4. **Diagnose**: Identify the root cause
5. **Resolve**: Apply appropriate fix
6. **Document**: Record the issue and solution

## Debugging Checklist

### Initial Investigation
- [ ] Understand the problem clearly
- [ ] Gather error messages and stack traces
- [ ] Check recent changes
- [ ] Identify affected components
- [ ] Determine impact scope

### Data Collection
- [ ] Collect relevant logs
- [ ] Get error reports
- [ ] Check monitoring data
- [ ] Gather system metrics
- [ ] Review configuration

### Analysis
- [ ] Analyze error patterns
- [ ] Correlate events
- [ ] Check dependencies
- [ ] Review code changes
- [ ] Examine environment differences

### Resolution
- [ ] Identify root cause
- [ ] Implement fix
- [ ] Test thoroughly
- [ ] Verify no regressions
- [ ] Add preventive measures

### Documentation
- [ ] Document the issue
- [ ] Explain the fix
- [ ] Update knowledge base
- [ ] Share with team
- [ ] Improve processes

## Best Practices

1. **Start Simple**: Check the obvious first
2. **Keep Notes**: Document your investigation
3. **Work Systematically**: Don't jump around randomly
4. **Ask Questions**: Don't assume, verify
5. **Isolate Variables**: Change one thing at a time
6. **Use Version Control**: Bisect commits if needed
7. **Check Assumptions**: Verify your beliefs
8. **Take Breaks**: Fresh eyes can help

## Prevention Strategies

- Add comprehensive error handling
- Implement proper logging
- Write tests for edge cases
- Use monitoring and alerting
- Document common issues
- Conduct code reviews
- Use static analysis tools
- Implement circuit breakers
