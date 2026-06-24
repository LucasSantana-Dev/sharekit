---
name: trigger-dev
description: Set up, configure, and deploy tasks with Trigger.dev. Use when initializing Trigger.dev in a project, writing background tasks, building AI agents, deploying with configuration extensions, or streaming real-time updates to frontend clients.
---

# Trigger.dev

Production-grade durable task orchestration, AI agent workflows, and real-time streaming.

## When to Use

| Goal | See |
|------|-----|
| Set up Trigger.dev from scratch | Setup |
| Configure build extensions (Prisma, Playwright, Python) | Configuration |
| Write background tasks, retries, queues, cron jobs | Tasks |
| Build AI agents, parallelization, prompt chaining, orchestration | Agents |
| Stream task progress, subscribe to runs, React real-time UI | Realtime |

## Quick Start

### 1. Install
```bash
npm install @trigger.dev/sdk
```

### 2. Initialize
```bash
npx trigger init
```

### 3. Create a Task
```ts
// trigger/my-task.ts
import { task } from "@trigger.dev/sdk";

export const myTask = task({
  id: "my-task",
  run: async (payload: { name: string }) => {
    return { message: `Hello ${payload.name}` };
  },
});
```

### 4. Start Dev Server
```bash
npx trigger dev
```

### 5. Trigger from Backend
```ts
import { tasks } from "@trigger.dev/sdk";
await tasks.trigger<typeof myTask>("my-task", { name: "World" });
```

---

## Setup

Get Trigger.dev running in your project in minutes.

### Prerequisites
- Node.js 18+ or Bun
- A Trigger.dev account (https://cloud.trigger.dev)

### Initialize Your Project

```bash
npx trigger init
```

This creates:
- `trigger.config.ts` - project configuration
- `trigger/` directory - where your tasks live
- `trigger/example.ts` - a sample task

### Configure trigger.config.ts

```ts
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_xxxxx", // From dashboard
  dirs: ["./trigger"],
});
```

### Set Environment Variables

Create `.env`:

```bash
TRIGGER_SECRET_KEY=tr_dev_xxxxx  # From dashboard > API Keys
```

Add to `.gitignore`:
```
.env
.env.local
```

### Project Structure

```
your-project/
├── trigger.config.ts    # Required - project config
├── trigger/             # Required - task files
│   ├── my-task.ts
│   └── another-task.ts
├── package.json
└── .env
```

**See:** `references/environment-setup.md`, `references/project-structure.md`

---

## Configuration

Configure your Trigger.dev project with build extensions.

### Basic Configuration

```ts
// trigger.config.ts
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "<project-ref>",
  dirs: ["./trigger"],
  runtime: "node", // "node", "node-22", or "bun"
  logLevel: "info",

  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    },
  },

  build: {
    extensions: [], // Add extensions here
  },
});
```

### Common Build Extensions

#### Prisma
```ts
import { prismaExtension } from "@trigger.dev/build/extensions/prisma";

extensions: [
  prismaExtension({
    schema: "prisma/schema.prisma",
    migrate: true,
  }),
]
```

#### Playwright (Browser Automation)
```ts
import { playwright } from "@trigger.dev/build/extensions/playwright";

extensions: [
  playwright({ browsers: ["chromium"] }),
]
```

#### FFmpeg (Media Processing)
```ts
import { ffmpeg } from "@trigger.dev/build/extensions/core";

extensions: [
  ffmpeg({ version: "7" }),
]
```

#### Python
```ts
import { pythonExtension } from "@trigger.dev/build/extensions/python";

extensions: [
  pythonExtension({
    scripts: ["./python/**/*.py"],
    requirementsFile: "./requirements.txt",
  }),
]
```

#### System Packages
```ts
import { aptGet } from "@trigger.dev/build/extensions/core";

extensions: [
  aptGet({ packages: ["imagemagick"] }),
]
```

**See:** `references/config.md`

---

## Tasks

Write durable background tasks with automatic retries, queuing, and observability.

### Basic Task

```ts
import { task } from "@trigger.dev/sdk";

export const processData = task({
  id: "process-data",
  retry: {
    maxAttempts: 10,
    factor: 1.8,
  },
  run: async (payload: { userId: string; data: any[] }) => {
    console.log(`Processing ${payload.data.length} items`);
    return { processed: payload.data.length };
  },
});
```

### Schema Task (Validated Input)

```ts
import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";

export const validatedTask = schemaTask({
  id: "validated-task",
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  run: async (payload) => {
    return { message: `Hello ${payload.name}` };
  },
});
```

### Trigger Tasks

#### From Backend
```ts
import { tasks } from "@trigger.dev/sdk";

// Single trigger
const handle = await tasks.trigger<typeof myTask>("my-task", { data: "value" });

// Batch trigger
const batchHandle = await tasks.batchTrigger<typeof myTask>("my-task", [
  { payload: { data: "item1" } },
  { payload: { data: "item2" } },
]);
```

#### From Inside Tasks
```ts
export const parentTask = task({
  id: "parent-task",
  run: async (payload) => {
    // Fire and forget
    await childTask.trigger({ data: "value" });

    // Wait for result
    const result = await childTask.triggerAndWait({ data: "value" });
    if (result.ok) {
      console.log("Output:", result.output);
    }
  },
});
```

### Scheduled Tasks (Cron)

```ts
import { schedules } from "@trigger.dev/sdk";

export const dailyTask = schedules.task({
  id: "daily-cleanup",
  cron: "0 0 * * *", // Midnight UTC
  run: async (payload) => {},
});
```

### Queues & Concurrency

```ts
import { task, queue } from "@trigger.dev/sdk";

const emailQueue = queue({
  name: "email-processing",
  concurrencyLimit: 5,
});

export const emailTask = task({
  id: "send-email",
  queue: emailQueue,
  run: async (payload) => {},
});
```

### Waits & Checkpoints

```ts
import { task, wait } from "@trigger.dev/sdk";

export const taskWithWaits = task({
  id: "task-with-waits",
  run: async (payload) => {
    await wait.for({ seconds: 30 });
    await wait.for({ minutes: 5 });
    await wait.until({ date: new Date("2024-12-25") });

    // Wait for external approval
    await wait.forToken({
      token: "user-approval-token",
      timeoutInSeconds: 3600,
    });
  },
});
```

**See:** `references/basic-tasks.md`, `references/advanced-tasks.md`, `references/scheduled-tasks.md`

---

## Agents

Build production-ready AI agents using Trigger.dev's durable execution.

### Pattern Selection

| Goal | Pattern |
|------|---------|
| Process items in parallel | Parallelization |
| Route to different models/handlers | Routing |
| Chain steps with validation gates | Prompt Chaining |
| Coordinate multiple specialized tasks | Orchestrator-Workers |
| Self-improve until approved | Evaluator-Optimizer |
| Pause for human approval | Human-in-the-Loop |

### Prompt Chaining (Sequential with Gates)

```ts
import { task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const translateCopy = task({
  id: "translate-copy",
  run: async ({ text, targetLanguage, maxWords }) => {
    // Step 1: Generate
    const draft = await generateText({
      model: openai("gpt-4o"),
      prompt: `Write marketing copy about: ${text}`,
    });

    // Gate: Validate before continuing
    const wordCount = draft.text.split(/\s+/).length;
    if (wordCount > maxWords) {
      throw new Error(`Draft too long: ${wordCount} > ${maxWords}`);
    }

    // Step 2: Translate (only if gate passed)
    const translated = await generateText({
      model: openai("gpt-4o"),
      prompt: `Translate to ${targetLanguage}: ${draft.text}`,
    });

    return { draft: draft.text, translated: translated.text };
  },
});
```

### Routing (Classify → Dispatch)

```ts
import { task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export const routeQuestion = task({
  id: "route-question",
  run: async ({ question }) => {
    // Cheap classification
    const routing = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `Classify complexity. Return JSON: {"model": "gpt-4o" | "o1-mini"}`,
        },
        { role: "user", content: question },
      ],
    });

    const { model } = JSON.parse(routing.text);

    // Route to selected model
    const answer = await generateText({
      model: openai(model),
      prompt: question,
    });

    return { answer: answer.text, routedTo: model };
  },
});
```

### Parallelization

```ts
import { batch, task } from "@trigger.dev/sdk";

export const analyzeContent = task({
  id: "analyze-content",
  run: async ({ text }) => {
    // All three run in parallel
    const { runs: [sentiment, summary, moderation] } = await batch.triggerByTaskAndWait([
      { task: analyzeSentiment, payload: { text } },
      { task: summarizeText, payload: { text } },
      { task: moderateContent, payload: { text } },
    ]);

    if (moderation.ok && moderation.output.flagged) {
      return { error: "Content flagged" };
    }

    return {
      sentiment: sentiment.ok ? sentiment.output : null,
      summary: summary.ok ? summary.output : null,
    };
  },
});
```

### Orchestrator-Workers (Fan-out/Fan-in)

```ts
import { batch, task } from "@trigger.dev/sdk";

export const factChecker = task({
  id: "fact-checker",
  run: async ({ article }) => {
    // Extract claims
    const { runs: [extractResult] } = await batch.triggerByTaskAndWait([
      { task: extractClaims, payload: { article } },
    ]);

    const claims = extractResult.output;

    // Fan-out: verify all claims in parallel
    const { runs } = await batch.triggerByTaskAndWait(
      claims.map(claim => ({ task: verifyClaim, payload: claim }))
    );

    // Fan-in: aggregate results
    const verified = runs
      .filter((r): r is typeof r & { ok: true } => r.ok)
      .map(r => r.output);

    return { claims, verifications: verified };
  },
});
```

### Evaluator-Optimizer (Self-Refining Loop)

```ts
import { task } from "@trigger.dev/sdk";

export const refineTranslation = task({
  id: "refine-translation",
  run: async ({ text, targetLanguage, feedback, attempt = 0 }) => {
    if (attempt >= 5) {
      return { text, status: "MAX_ATTEMPTS", attempts: attempt };
    }

    // Generate (with feedback if retrying)
    const translation = await generateText({
      model: openai("gpt-4o"),
      prompt: feedback
        ? `Improve based on feedback:\n${feedback}`
        : `Translate to ${targetLanguage}: ${text}`,
    });

    // Evaluate
    const evaluation = await generateText({
      model: openai("gpt-4o"),
      prompt: `Evaluate translation quality. Reply APPROVED or provide feedback:\n${translation.text}`,
    });

    if (evaluation.text.includes("APPROVED")) {
      return { text: translation.text, status: "APPROVED", attempts: attempt + 1 };
    }

    // Recursive self-call with feedback
    return refineTranslation.triggerAndWait({
      text,
      targetLanguage,
      feedback: evaluation.text,
      attempt: attempt + 1,
    }).unwrap();
  },
});
```

**See:** `references/orchestration.md`, `references/ai-tool.md`

---

## Realtime

Subscribe to task runs and stream data in real-time from frontend and backend.

### Backend Subscriptions

```ts
import { runs, tasks } from "@trigger.dev/sdk";

// Trigger and subscribe
const handle = await tasks.trigger("my-task", { data: "value" });

for await (const run of runs.subscribeToRun(handle.id)) {
  console.log(`Status: ${run.status}`);
  
  if (run.status === "COMPLETED") {
    console.log("Output:", run.output);
    break;
  }
}
```

### React Hooks

```bash
npm add @trigger.dev/react-hooks
```

#### Trigger Task from React

```tsx
"use client";
import { useRealtimeTaskTrigger } from "@trigger.dev/react-hooks";

function TaskTrigger({ accessToken }: { accessToken: string }) {
  const { submit, run, isLoading } = useRealtimeTaskTrigger<typeof myTask>(
    "my-task",
    { accessToken }
  );

  return (
    <div>
      <button onClick={() => submit({ data: "value" })} disabled={isLoading}>
        Start Task
      </button>
      {run && <p>Status: {run.status}</p>}
    </div>
  );
}
```

#### Subscribe to Existing Run

```tsx
"use client";
import { useRealtimeRun } from "@trigger.dev/react-hooks";

function RunStatus({ runId, accessToken }: { runId: string; accessToken: string }) {
  const { run, error } = useRealtimeRun<typeof myTask>(runId, {
    accessToken,
  });

  if (!run) return <div>Loading...</div>;
  return <p>Status: {run.status} | Progress: {run.metadata?.progress || 0}%</p>;
}
```

### AI/LLM Streams

#### Define Stream

```ts
// trigger/streams.ts
import { streams } from "@trigger.dev/sdk";

export const aiStream = streams.define<string>({
  id: "ai-output",
});
```

#### Pipe Stream in Task

```ts
import { task } from "@trigger.dev/sdk";
import { aiStream } from "./streams";

export const streamingTask = task({
  id: "streaming-task",
  run: async (payload: { prompt: string }) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: payload.prompt }],
      stream: true,
    });

    const { waitUntilComplete } = aiStream.pipe(completion);
    await waitUntilComplete();
  },
});
```

#### Read Stream in React

```tsx
"use client";
import { useRealtimeStream } from "@trigger.dev/react-hooks";
import { aiStream } from "../trigger/streams";

function AIResponse({ runId, accessToken }: { runId: string; accessToken: string }) {
  const { parts, error } = useRealtimeStream(aiStream, runId, {
    accessToken,
  });

  if (!parts) return <div>Waiting...</div>;
  return <div>{parts.join("")}</div>;
}
```

### Human-in-the-Loop

#### In Task (Wait for Approval)

```ts
import { task, wait } from "@trigger.dev/sdk";

export const approvalTask = task({
  id: "approval-task",
  run: async (payload) => {
    const processed = await processData(payload);

    const approval = await wait.forToken<{ approved: boolean }>({
      token: `approval-${payload.id}`,
      timeoutInSeconds: 86400, // 24 hours
    });

    if (approval.approved) {
      return await finalizeData(processed);
    }
    
    throw new Error("Not approved");
  },
});
```

#### Complete Token from React

```tsx
"use client";
import { useWaitToken } from "@trigger.dev/react-hooks";

function ApprovalButton({ tokenId, accessToken }: { tokenId: string; accessToken: string }) {
  const { complete } = useWaitToken(tokenId, { accessToken });

  return (
    <div>
      <button onClick={() => complete({ approved: true })}>Approve</button>
      <button onClick={() => complete({ approved: false })}>Reject</button>
    </div>
  );
}
```

**See:** `references/realtime.md`, `references/streaming.md`, `references/waitpoints.md`

---

## Critical Rules

1. **Always use `@trigger.dev/sdk`** — never use deprecated `client.defineJob`
2. **Check `result.ok`** before accessing `result.output` from `triggerAndWait()`
3. **Never use `Promise.all`** with `triggerAndWait()` or `wait.*` calls
4. **Export tasks** from files in your `trigger/` directory
5. **Make tasks idempotent** — safe to retry without side effects
6. **Use queues** to prevent overwhelming external services
7. **Scope tokens narrowly** — only grant necessary permissions

## Best Practices

- Pin versions in `trigger.config.ts` for reproducible builds
- Use `syncEnvVars` extension for dynamic secrets
- Configure appropriate retries with exponential backoff
- Track progress with metadata for long-running tasks
- Use debouncing for user activity and webhook bursts
- Match machine size to computational requirements
- Set expiration times on realtime tokens — don't use long-lived tokens
