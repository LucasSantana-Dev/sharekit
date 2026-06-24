# Performance baselines

Web Vitals targets per surface type. Use these to validate generated UI and catch regressions early.

## Core Web Vitals targets

| Surface | LCP target | INP target | CLS target | Notes |
|---|---|---|---|---|
| Marketing / landing | ≤2.5s | ≤200ms | <0.1 | LCP often hero image; focus on first paint |
| Product app shell | ≤2.5s | ≤200ms | <0.1 | First content paint matters more than final interactive state |
| Data-dense dashboard | ≤4.0s | ≤500ms | <0.1 | Table virtualization mandatory |
| AI chat / agent surface | ≤2.5s for shell | TTFT ≤1s | <0.1 | Streaming masks total response time |
| Mobile web | All Web Vitals × 1.0 | INP critical | <0.1 | Mid-tier Android baseline |

**Definitions** (from web.dev):
- **LCP (Largest Contentful Paint)** — time when the largest content element becomes visible. Good ≤2.5s, needs improvement ≤4s, poor >4s.
- **INP (Interaction to Next Paint)** — latency of the slowest interaction in a session at p75. Good ≤200ms, needs improvement ≤500ms, poor >500ms.
- **CLS (Cumulative Layout Shift)** — sum of all layout shifts not caused by user input. Good <0.1, needs improvement <0.25, poor ≥0.25.

## Per-register baselines

| Register | LCP | INP | CLS | Notes |
|---|---|---|---|---|
| developer-tooling | ≤2.5s | ≤200ms | <0.1 | Keyboard-first surfaces; no jank on shortcut nav. Sidebar + content density. |
| fintech | ≤2.5s | ≤200ms | <0.1 | Number stability critical. Use `font-display: optional` + tabular-nums. Real-time updates must batch. |
| consumer-saas | ≤2.5s | ≤200ms | <0.1 | Responsive imagery; optimize for 4G. Onboarding surfaces < 2s. |
| enterprise-admin | ≤4.0s | ≤500ms | <0.1 | Larger payloads acceptable if table virtualization + code-splitting active. Dashboard > form surfaces. |
| b2b-data-dense | ≤4.0s | ≤500ms | <0.1 | Virtualized tables mandatory. Charts (D3/Recharts) deferred. Filters interactive in <500ms. |
| editorial-marketing | ≤2.5s | ≤200ms | <0.1 | Hero imagery optimized (WebP + AVIF, lazy-load below fold). No auto-play video with sound. |
| ai-first | ≤2.5s for shell + TTFT ≤1s | TTFT ≤1s (stream masked) | <0.1 | Streaming cursor + token display hides total time. Code blocks deferred. Avoid huge context on first paint. |

## LLM streaming metrics

These apply to `ai-first` register and any generative surface.

- **TTFT (Time to First Token)** — latency from user submit to first byte of response. Target ≤1.0s; ≥2.0s feels broken. Includes backend processing + network.
- **TPOT (Time Per Output Token)** — average latency between consecutive tokens. Target ≤50ms (≥20 tokens/sec); <30ms excellent, >100ms perceptible slowdown.
- **Total response time** — masked by streaming; user satisfaction depends on TTFT + perceived speed (cursor animation + token reveal). Longer responses feel instant if TTFT is fast.

**Perceived speed**: A streaming response with TTFT 0.8s feels faster than a buffered response with total time 1.2s. Optimize TTFT first; then optimize TPOT for smooth perceived flow.

## Common regressions

Catch these before shipping:

1. **Unoptimized images** (LCP regression)
   - Use WebP + AVIF with fallback JPEG
   - Add `loading="lazy"` for below-fold images
   - Set explicit width/height to prevent CLS
   - Use `priority` hint in Next.js Image for LCP target

2. **3rd-party scripts block main thread** (INP regression)
   - Analytics, tracking pixels, widgets → defer or use Web Worker
   - Move to `<script>` tag placement `defer` or async
   - Check DevTools Performance tab for long tasks (>50ms on main thread)

3. **Font swap causes CLS** (CLS regression)
   - Use `font-display: optional` for web fonts (blocks render 0ms, shows system fallback)
   - OR `font-display: swap` with generous line-height to absorb metric changes
   - Set both `font-family` CSS and HTML `lang` attribute so fallback metrics match

4. **Code-splitting not configured** (INP regression)
   - Route-based code splitting: Next.js dynamic imports, React lazy() + Suspense
   - Component-heavy surfaces: virtualize lists, defer non-viewport components
   - Check DevTools Network tab: JS bundle >200kb is a red flag

5. **Layout thrashing in JS** (INP regression)
   - Reading + writing DOM in tight loops: `el.scrollLeft`, then `el.style.transform`, then `el.scrollLeft` again
   - Use computed styles batched, not per element

## Verification commands

Run these locally to validate UI meets baselines:

```bash
# Full Lighthouse audit (performance + best practices + a11y)
npx lighthouse <url> --only-categories=performance --output html --output-path ./lh.html

# Fast unified audit (Lighthouse + web.dev all-metrics)
npx unlighthouse <url>

# Manual Core Web Vitals via web.dev Measure
# Visit: https://web.dev/measure
# Paste your live URL; returns field data + lab measurements
```

In DevTools (Chrome):
1. Open Performance tab
2. Record a user interaction (click, scroll, keystroke)
3. Stop recording; check "Main" thread for tasks >50ms (INP)
4. Check "Rendering" for paint events (LCP timing)
5. Look for unexpected layout shifts (CLS sources)

## Sources

- https://web.dev/articles/vitals
- https://web.dev/articles/inp
- https://web.dev/articles/lcp
- https://web.dev/articles/cls
- https://developer.chrome.com/docs/devtools/performance
