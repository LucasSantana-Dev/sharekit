---
name: langfuse-observe
description: Set up Langfuse LLM observability to trace Claude API calls with costs, tokens, and latency
user-invocable: true
argument-hint: "[--setup | --query | --status]"
---

# Langfuse Observe Skill

Instrument your Claude API calls with Langfuse to get production-grade traces: token count, cost per request, latency, error tracking, and user-level analytics.

## What is Langfuse?

Langfuse is an open-source LLM observability platform that:
- Captures every LLM call with input, output, tokens, cost, and latency
- Groups related calls into traces (e.g., a multi-turn conversation)
- Provides a web UI for browsing traces, filtering by latency/cost/errors
- Exports trace data via REST API for custom analysis
- Supports self-hosted deployment (Docker) or cloud (free tier: 50k events/month)

## Setup Options

### Option 1: Self-Hosted (Docker)

**Quick Start:**
```bash
# Clone the repo
git clone https://github.com/langfuse/langfuse.git
cd langfuse

# Use official docker-compose.yml
docker compose up langfuse
# Accessible at http://localhost:3000
```

**First Run:**
1. Create account at `http://localhost:3000`
2. Create a project
3. Go to Settings → API Keys
4. Note down `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY`

**Environment:**
```bash
export LANGFUSE_PUBLIC_KEY=pk_...
export LANGFUSE_SECRET_KEY=sk_...
export LANGFUSE_BASEURL=http://localhost:3000  # If self-hosted
```

### Option 2: Cloud (langfuse.com)

**Setup:**
1. Sign up at [langfuse.com](https://langfuse.com) (free: 50k events/month)
2. Create a project
3. Copy API keys from Settings
4. Set environment variables:
   ```bash
   export LANGFUSE_PUBLIC_KEY=pk_...
   export LANGFUSE_SECRET_KEY=sk_...
   # LANGFUSE_BASEURL defaults to https://api.langfuse.com (no need to set)
   ```

## SDK Integration

### Node.js / TypeScript
```bash
npm install langfuse
```

### Python
```bash
pip install langfuse
```

## Wrapper Pattern: Node.js Example

```javascript
const { Langfuse } = require("langfuse");
const Anthropic = require("@anthropic-ai/sdk");

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || "https://api.langfuse.com"
});

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function callWithTrace(prompt, traceId) {
  const trace = langfuse.trace({
    id: traceId || `trace-${Date.now()}`,
    name: "claude-call",
    input: { prompt }
  });

  const span = trace.span({
    name: "message-creation",
    input: { prompt }
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  });

  span.end({
    output: response.content[0].text,
    metadata: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens
    }
  });

  trace.update({
    output: response.content[0].text
  });

  return response;
}

// Usage
callWithTrace("What is quantum computing?", "demo-001");
```

### Python Example

```python
from langfuse import Langfuse
import anthropic

langfuse = Langfuse(
    public_key=os.getenv("LANGFUSE_PUBLIC_KEY"),
    secret_key=os.getenv("LANGFUSE_SECRET_KEY")
)

client = anthropic.Anthropic()

def call_with_trace(prompt, trace_id=None):
    trace = langfuse.trace(
        id=trace_id or f"trace-{int(time.time() * 1000)}",
        name="claude-call",
        input={"prompt": prompt}
    )

    span = trace.span(
        name="message-creation",
        input={"prompt": prompt}
    )

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    span.end(
        output=response.content[0].text,
        metadata={
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "total_tokens": response.usage.input_tokens + response.usage.output_tokens
        }
    )

    trace.update(output=response.content[0].text)
    return response

# Usage
call_with_trace("What is quantum computing?")
```

## What to Monitor

### Traces View
- **Latency**: Filter traces by duration; find slow requests
- **Tokens**: Group by total tokens to identify expensive calls
- **Error Rate**: Filter by status = error; spot systemic issues
- **Cost Trend**: Calculate cost per trace; spot runaway costs

### Key Metrics
- **Cost per trace**: input_tokens × $0.003 + output_tokens × $0.015 (Claude 3.5 Sonnet pricing)
- **P95 Latency**: 95th percentile response time; identify tail latency
- **Token Efficiency**: output tokens / input tokens; watch for bloated prompts
- **Error Count**: Failed API calls per day

### Custom Queries (via API)

```bash
# Get traces from last 24h
curl "https://api.langfuse.com/api/traces?limit=100" \
  -H "x-api-key: pk_..." \
  -H "x-secret-key: sk_..."
```

## Dashboard Features

1. **Trace Browser**: Search by name, input, output, metadata
2. **Latency Distribution**: Histogram of response times
3. **Cost Analysis**: Total cost, cost per trace, cost trend
4. **Error Tracking**: Stack traces, error rates over time
5. **User Analytics**: Cost and request volume per user (if tagged)

## Common Patterns

### Tag by User
```javascript
trace.update({
  userId: "user-123",
  sessionId: "session-456"
});
```

### Tag by Feature
```javascript
span.update({
  metadata: { feature: "search", component: "query-rewriter" }
});
```

### Capture Cost Manually
```javascript
span.end({
  metadata: {
    costUSD: (inputTokens * 0.003 + outputTokens * 0.015) / 1000
  }
});
```

## Troubleshooting

- **Traces not showing**: Verify API keys; check firewall (cloud requires internet access)
- **Rate limiting**: Free tier has 50k events/month; pay-as-you-go for unlimited
- **Missing token counts**: Include in span metadata explicitly if not auto-captured
- **Latency overhead**: Langfuse batches traces async; ~10ms overhead per call

## Next Steps

1. Choose self-hosted or cloud
2. Get API keys
3. Install SDK in your project
4. Wrap one Claude call with Langfuse trace
5. Send a few requests
6. Check Langfuse UI for traces
7. Set up cost alerts in dashboard

---

**Invocation pattern**: `/langfuse-observe --setup` for guided setup, `/langfuse-observe --status` to verify integration, `/langfuse-observe --query` for recent trace stats.
