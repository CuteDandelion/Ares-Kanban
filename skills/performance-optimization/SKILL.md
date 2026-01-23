---
name: performance-optimization
description: Profile code, identify bottlenecks, optimize performance, and benchmark applications
license: MIT
compatibility: opencode
metadata:
  audience: developers
  expertise: performance
---

## What I do

I provide comprehensive performance optimization capabilities to ensure your applications run efficiently and scale well.

### Core Capabilities

#### Profiling & Analysis
- CPU profiling to identify hot spots
- Memory profiling to find leaks
- I/O profiling for disk/network operations
- Database query analysis
- Call graph analysis
- Flame graph generation

#### Bottleneck Identification
- Find slow functions and methods
- Identify inefficient algorithms
- Detect N+1 query problems
- Find memory allocation issues
- Identify synchronization bottlenecks
- Detect excessive I/O operations

#### Code Optimization
- Optimize algorithms and data structures
- Improve cache locality
- Reduce unnecessary allocations
- Optimize loops and iterations
- Use lazy loading appropriately
- Implement memoization
- Optimize string operations

#### Database Optimization
- Analyze query execution plans
- Add appropriate indexes
- Optimize joins and subqueries
- Implement caching strategies
- Reduce database round trips
- Optimize data types and schemas
- Use connection pooling

#### Caching Strategies
- Implement in-memory caching
- Use Redis/Memcached
- Implement CDN caching
- Browser caching optimization
- API response caching
- Cache invalidation strategies

#### Concurrency & Parallelism
- Implement parallel processing
- Use async/await appropriately
- Optimize thread pool usage
- Reduce lock contention
- Use concurrent data structures
- Implement worker pools

#### Network Optimization
- Optimize API calls
- Implement request batching
- Use compression (gzip, brotli)
- Optimize HTTP/2 usage
- Reduce payload sizes
- Implement connection reuse

## When to use me

Use this when you need to:
- Analyze slow applications
- Reduce memory usage
- Improve response times
- Optimize database queries
- Scale applications
- Reduce infrastructure costs
- Improve user experience
- Meet performance SLAs

## Profiling Tools

### Python Profiling
```bash
# CPU profiling
python -m cProfile -s cumtime script.py
python -m timeit -n 1000 function()

# Memory profiling
python -m memory_profiler script.py
mprof run script.py

# Flame graph
py-spy top --pid <PID>
```

### Node.js Profiling
```bash
# CPU profiling
node --prof script.js
node --prof-process isolate-*.log > processed.txt

# Heap snapshot
node --heap-prof script.js

# Clinic.js
clinic heprof -- node script.js
clinic flame -- node script.js
```

### Java Profiling
```bash
# Java Flight Recorder
jcmd <pid> JFR.start duration=60s filename=recording.jfr

# VisualVM
jvisualvm

# YourKit, JProfiler (commercial)
```

### Go Profiling
```bash
# CPU profiling
go test -cpuprofile=cpu.prof
go tool pprof cpu.prof

# Memory profiling
go test -memprofile=mem.prof
go tool pprof mem.prof

# Benchmarking
go test -bench=. -benchmem
```

## Database Optimization

### Query Analysis
```sql
-- Analyze query execution plan
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Check index usage
SELECT * FROM pg_stat_user_indexes;

-- Find slow queries
SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC;
```

### Indexing Strategies
- Create indexes on frequently queried columns
- Use composite indexes for multi-column queries
- Consider covering indexes
- Monitor index usage
- Remove unused indexes

## Optimization Techniques

### Algorithm Optimization
- **Time Complexity**: Choose O(log n) over O(n²)
- **Space Complexity**: Use in-place operations when possible
- **Data Structures**: Choose appropriate structures (hash map vs array)
- **Precomputation**: Cache expensive computations

### Memory Optimization
- **Object Pooling**: Reuse objects instead of creating new ones
- **String Interning**: Share identical strings
- **Lazy Loading**: Load data only when needed
- **Stream Processing**: Process data in chunks, not all at once
- **Weak References**: Allow garbage collection

### Caching
- **Memoization**: Cache function results
- **LRU Cache**: Least recently used eviction
- **TTL**: Time-to-live expiration
- **Cache Aside**: Check cache before DB
- **Write Through**: Update cache and DB together

### Concurrency
- **Async I/O**: Non-blocking operations
- **Thread Pools**: Reuse threads
- **Lock-Free**: Use atomic operations
- **Partitioning**: Reduce contention
- **Read-Write Locks**: Allow concurrent reads

## Performance Metrics

### Key Metrics
- **Response Time**: Time to process a request
- **Throughput**: Requests per second
- **Latency**: Time delay in communication
- **Memory Usage**: RAM consumption
- **CPU Usage**: Processor utilization
- **I/O Wait**: Time waiting for disk/network

### Thresholds
- **Response Time**: < 200ms (excellent), < 500ms (good), < 1000ms (acceptable)
- **Throughput**: Scale to handle peak load
- **Error Rate**: < 0.1%
- **CPU Usage**: < 70% average
- **Memory Usage**: < 80% of available

## Optimization Workflow

1. **Baseline**: Measure current performance
2. **Profile**: Identify bottlenecks
3. **Analyze**: Understand root causes
4. **Optimize**: Apply improvements
5. **Measure**: Verify improvements
6. **Iterate**: Continue until target met

## What I Deliver

When you invoke me for performance optimization:
1. **Profile**: Run profiling tools and gather metrics
2. **Analyze**: Identify bottlenecks and hot spots
3. **Prioritize**: Focus on high-impact optimizations
4. **Implement**: Apply performance improvements
5. **Benchmark**: Measure performance gains
6. **Document**: Record optimizations and results

## Best Practices

1. **Measure First**: Don't optimize without data
2. **Premature Optimization**: Avoid it
3. **Focus on Hot Paths**: Optimize frequently executed code
4. **Micro-optimizations**: Usually not worth it
5. **Amdahl's Law**: Focus on largest gains
6. **Test Thoroughly**: Ensure correctness after optimization
7. **Monitor Continuously**: Performance degrades over time

## Common Performance Issues

### Issues to Look For
- ❌ N+1 query problems
- ❌ Missing database indexes
- ❌ Excessive memory allocations
- ❌ Blocking I/O operations
- ❌ Unnecessary database round trips
- ❌ Inefficient algorithms (O(n²) when O(n log n) possible)
- ❌ Synchronous operations that could be async
- ❌ Large payload transfers
- ❌ No caching for expensive operations
- ❌ Excessive logging in hot paths

### Quick Wins
- Add database indexes
- Enable query result caching
- Compress HTTP responses
- Use CDN for static assets
- Implement connection pooling
- Add lazy loading for data
- Optimize images and assets
- Use HTTP/2
- Enable gzip/brotli compression
