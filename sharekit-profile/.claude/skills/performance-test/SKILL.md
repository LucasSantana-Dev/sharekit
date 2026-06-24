---
name: performance-test
description: Run a performance-testing workflow for UIForge MCP to identify bottlenecks,
  gather benchmarks, and recommend optimizations. Use when the task is specifically
  about performance validation or tuning for UIForge MCP.
tools:
- Read
- Bash
- Grep
metadata:
  owner: global-agents
  tier: contextual
---














# Performance Testing Workflow

This skill performs comprehensive performance testing and optimization analysis for UIForge MCP, identifying bottlenecks and providing actionable optimization recommendations.

## When to Use

- Before deploying to production
- After major feature changes
- When performance issues are reported
- During optimization sprints

## Performance Analysis Areas

### 1. Code Performance
- Algorithm efficiency analysis
- Memory usage profiling
- CPU utilization monitoring
- I/O operation optimization

### 2. MCP Tool Performance
- Tool execution time measurement
- Resource consumption analysis
- Concurrent request handling
- Response time optimization

### 3. Database Performance
- Query optimization analysis
- Index usage validation
- Connection pool efficiency
- Data access patterns

### 4. Network Performance
- API response times
- Data transfer optimization
- Caching effectiveness
- Latency analysis

### 5. Component Performance
- Rendering performance
- Component load times
- Memory leak detection
- Resource cleanup validation

## Usage

Run comprehensive performance analysis:
```
/performance-test
```

Focus on specific areas:
```
/performance-test --code
/performance-test --mcp-tools
/performance-test --database
/performance-test --components
```

Benchmark specific functionality:
```
/performance-test --benchmark generate-ui-component
/performance-test --profile src/lib/ml/
```

## Performance Metrics

### Response Time Analysis
- Average response times
- 95th percentile performance
- Peak load performance
- Degradation patterns

### Resource Utilization
- Memory usage patterns
- CPU consumption analysis
- I/O operation efficiency
- Network bandwidth usage

### Throughput Metrics
- Requests per second
- Concurrent user capacity
- Data processing rates
- Batch operation efficiency

## Output

Returns comprehensive performance report with:
- **Performance Baselines** and current metrics
- **Bottleneck Identification** and root cause analysis
- **Optimization Recommendations** with implementation guidance
- **Benchmark Results** and performance comparisons
- **Monitoring Setup** for ongoing performance tracking

## Integration

Works with performance-focused subagents:
- **deployment-engineer** for infrastructure performance
- **component-generator** for component optimization
- **ml-specialist** for ML performance tuning
- **testing-specialist** for performance testing

## Optimization Features

### Automated Optimization
- Code refactoring suggestions
- Algorithm replacement recommendations
- Caching strategy implementation
- Resource usage optimization

### Performance Monitoring
- Real-time performance tracking
- Alert configuration for degradation
- Performance regression detection
- Trend analysis and reporting

### Benchmarking Tools
- Custom benchmark creation
- Performance comparison tracking
- Load testing scenarios
- Stress testing capabilities

## Failure / Stop Conditions

- Stop if required credentials, environment access, or prerequisite context are missing.
- Stop if the workflow would report unverified work as complete.
- Do not bypass required gates or safeguards unless the user explicitly asks for it.

## Memory Hooks

- Read memory when product, repo, or workflow history affects correctness.
- Write memory only if this work establishes a durable policy or convention.
