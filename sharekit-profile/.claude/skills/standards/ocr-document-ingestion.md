# OCR Document Ingestion (deferred capability — NOT auto-loaded)

Reference documentation for incorporating scanned PDFs and document images into RAG systems via optical character recognition (OCR). This is a deferred capability — not installed, configured, or active by default. Adopt only when there is a concrete need to ingest scanned documents or images into a knowledge base or retrieval system.

## Pipeline summary

The production-recommended approach uses **PaddleOCR** (open-source, runs locally, no API quota) with a **vision-language model** backbone for structured extraction:

```
Scanned PDF / Image File
         ↓
  PaddleOCR Engine (PP-StructureV3)
  - Text extraction (layout-aware)
  - Table detection + OCR
  - Figure bounding boxes
         ↓
  Post-processing layer
  - Markdown serialization (sections, tables, lists)
  - Layout preservation (headings, indentation)
  - Figure captions + references
         ↓
  RAG-ready Markdown chunks
  (indexed in claude-mem / rag-index / Pinecone)
```

For complex layouts (multi-column, dense tables, figure placement), supplement with **PaddleOCR-VL** (vision-language variant) to improve semantic understanding and heading hierarchy recovery.

## Why PaddleOCR

- **No external API** — runs entirely on-device (or on a private cloud backend)
- **No quota limits** — process unlimited documents
- **Structured output** — table and figure detection built in
- **Multilingual** — supports 80+ languages out of the box
- **Low latency** — CPU inference for edge models (~10MB) or GPU for larger models
- **Reproducible** — same document always produces the same output (unlike cloud APIs with varying model versions)

## Token cost warnings

OCR output is **verbose by nature**. A 50-page scanned document can produce 5,000–15,000 tokens of raw OCR text, far exceeding the original document's semantic content. Before indexing:

1. **Chunk aggressively** — split OCR output into 256–512 token chunks (vs. the typical 1024 for born-digital text), prioritizing semantic boundaries (sections, tables).
2. **Summarize or extract** — for reference documents, extract key facts or summaries rather than indexing raw OCR. Use a Claude model to post-process high-confidence OCR output, filtering noise and duplication.
3. **Estimate indexing cost** — expect 3–5x token overhead vs. the final retrieved snippets. A 500-page document run through OCR + chunking + embedding can cost $2–$10 in API calls (Claude + embedding model), depending on model size and re-indexing frequency.
4. **Lazy indexing** — index on-demand (only documents users actually search for) rather than bulk-indexing an entire archive upfront.

Example token budget:
- 50-page PDF scanned at 300 DPI: ~250 KB image data → ~10,000 OCR tokens
- Chunked to 256-token segments: ~40 chunks
- Embedded (text-embedding-3-small): 40 chunks × 384 dims = 15,360 embedding tokens
- Claude reading all chunks to extract facts: +10,000 tokens
- **Total cost for one 50-page document:** ~35,000 tokens from OCR pipeline alone

## Model size tiers

Choose a model based on document complexity and available hardware:

| Tier | Model | Size | Latency (CPU) | Latency (GPU) | Best for |
|------|-------|------|---------------|---------------|----------|
| **Edge** | PP-StructureV3-Lite | ~10 MB | 15–40 s/page | 2–5 s/page | Simple documents; high-volume; local-first |
| **Mobile** | PP-StructureV3 (base) | ~50 MB | 5–15 s/page | 1–2 s/page | Mixed layouts; tables; balance of speed/accuracy |
| **Cloud** | PP-StructureV3-Large | ~200+ MB | 2–8 s/page | 0.5–1 s/page | Dense layouts; small text; archival quality |
| **Vision-Language** | PaddleOCR-VL | ~1 B+ | 30–120 s/page | 3–10 s/page | Semantic layout recovery; figure captions; heading hierarchy |

Latencies assume single-page processing. Batch processing (100+ pages) amortizes startup and can run 2–3x faster per page.

## Configuration (commented-out; optional)

If adopting OCR for a real ingestion pipeline, uncomment and customize this MCP server config in `~/.mcp.json` or `.claude/settings.json`:

```json
{
  "mcpServers": {
    "paddleocr-mcp": {
      "command": "python3",
      "args": [
        "-m",
        "paddleocr_mcp"
      ],
      "env": {
        "PADDLE_OCR_LANG": "en",
        "PADDLE_OCR_USE_GPU": "false",
        "PADDLE_OCR_MODEL_BACKEND": "structure_v3",
        "PADDLE_OCR_OUTPUT_FORMAT": "markdown"
      }
    }
  }
}
```

**Parameters:**
- `PADDLE_OCR_LANG`: Language (e.g., 'en', 'zh', or comma-separated list for multi-language documents)
- `PADDLE_OCR_USE_GPU`: Set to 'true' if a CUDA-capable GPU is available and you have `paddlepaddle-gpu` installed
- `PADDLE_OCR_MODEL_BACKEND`: Use `'structure_v3'` for table-aware extraction, `'structure_v3_lite'` for edge constraints
- `PADDLE_OCR_OUTPUT_FORMAT`: Set to `'markdown'` for RAG ingestion; other options include 'json' (raw bounding boxes) and 'text' (plaintext fallback)

**Installation (not done by default):**

```bash
# Core OCR engine
pip install paddlepaddle paddleocr

# Optional: vision-language variant (heavier, better semantics)
pip install paddleocr[vision-language]

# Optional: MCP server wrapper (bridges OCR output to Claude Code)
pip install paddleocr-mcp  # not yet published; build locally if needed
```

Do NOT install unless you have an active OCR ingestion task. These packages are heavy (~500 MB with dependencies) and will expand your environment unnecessarily.

## Workflow (adoption checklist)

When you decide to ingest a scanned document:

1. **Scope the document** — estimate page count, layout complexity (simple text vs. multi-column vs. dense tables), and language coverage.
2. **Choose a model tier** — start with `PP-StructureV3` (base) unless you have edge constraints (resource-limited device) or archival requirements.
3. **Enable GPU if available** — check `nvidia-smi` or `system_profiler SPDisplaysDataType | grep VRAM`. If you have >4 GB dedicated VRAM, set `PADDLE_OCR_USE_GPU=true`.
4. **Run a pilot on 5–10 pages** — extract, review for errors (missed tables, garbled text), and adjust model/language if needed.
5. **Measure token cost** — count raw OCR output tokens; multiply by 1.5–2 for chunking overhead; budget for embedding + Claude reading if you plan to summarize.
6. **Chunk and index** — serialize OCR output to Markdown, chunk at semantic boundaries, embed with a lightweight model (text-embedding-3-small), and add to claude-mem or rag-index.
7. **Validate retrieval** — test a few retrieval queries against the indexed document to confirm the chunks are searchable and accurate.

## Known limitations and workarounds

### Limitation: Handwritten notes or non-standard scripts

**Issue:** PaddleOCR is trained primarily on printed text. Handwriting, cursive, or scripts outside its training data (e.g., cuneiform, rare East Asian variants) will fail silently or produce gibberish.

**Workaround:** If the document contains handwriting, use a cloud API (Google Document AI, AWS Textract) for those pages and fall back to PaddleOCR for the printed sections. This increases cost but avoids garbage output.

### Limitation: Colors, stamps, watermarks

**Issue:** PaddleOCR ignores color information (works on grayscale). Colored text warnings, colored table headers, or color-coded regions will lose meaning.

**Workaround:** If color is semantically important, extract images of those regions separately and store as references in Markdown (`![colored-header](page5-region.png)`). Include a note in the Markdown explaining the color context.

### Limitation: Scanned PDFs with embedded text

**Issue:** If a PDF already contains searchable text (common in modern documents), running OCR on the rasterized page image is wasteful and may produce worse results than extracting native text.

**Workaround:** Before OCR, check if the PDF is searchable using `pdftotext` (poppler) or `PyPDF2`. If text extracts cleanly, use the native text; reserve OCR for image-only PDFs.

```bash
# Check if PDF is searchable
pdftotext my_doc.pdf - | head -20

# If output is gibberish, run OCR instead
```

### Limitation: Table column alignment in Markdown

**Issue:** Wide tables with many columns don't serialize cleanly to Markdown. The table may exceed terminal width or be hard to read in plain text.

**Workaround:** For dense tables, export as HTML or JSON instead of Markdown, then render to Markdown with better column handling. Alternatively, split wide tables into multiple smaller tables or reformat as key-value pairs.

## Integration with RAG systems

### Claude-mem (on-device memory)

Index OCR output under a document key:

```bash
# Add to ~/.claude-mem/memories/
cat > documents/scanned_manual.md << 'EOF'
# Operator Manual (Scanned)

(paste OCR Markdown output here, chunked to 500 tokens per section)
EOF
```

Then query with `/recall` or memory searches within Claude Code.

### rag-index (Pinecone / local vector DB)

Use a chunking script to split OCR Markdown and embed:

```python
import openai
from paddleocr import PaddleOCR

ocr = PaddleOCR(lang='en', use_gpu=False)
results = ocr.ocr('document.pdf', cls=True)

# Serialize to Markdown
markdown = serialize_ocr_to_markdown(results)

# Chunk
chunks = chunk_by_section(markdown, max_tokens=256)

# Embed
embeddings = [
    openai.Embedding.create(model='text-embedding-3-small', input=chunk)
    for chunk in chunks
]

# Index in Pinecone / local DB
index.upsert([(chunk, embedding) for chunk, embedding in zip(chunks, embeddings)])
```

### Workflow with Claude + MCP

If the `paddleocr-mcp` server is installed and configured:

1. Use Claude Code to invoke the MCP: `paddleocr.process_document(file_path)` returns Markdown.
2. Post-process the Markdown to extract structured facts (e.g., extract all "Warning:" sections into a separate index).
3. Store in claude-mem or rag-index.
4. On subsequent queries, `/recall` retrieves relevant sections without re-running OCR.

## Adoption trigger checklist

Do NOT set up OCR infrastructure unless you hit at least one of these conditions:

- A real project requires ingesting scanned contracts, manuals, or archival documents.
- A user has requested OCR-enabled search across a specific document set.
- You are building a knowledge base that must include non-digital (scanned) source material.
- A document's native text extraction is failing (e.g., PDF has no embedded text layer), and manual transcription is infeasible.

If none of these apply, leave this capability deferred. The overhead of maintaining OCR infrastructure (model updates, dependency bloat, token budget) is not worth the occasional one-off document.

## Decision record

Status: deferred · date: 2026-06-24 · revisit_after: adoption trigger hits

This document establishes the **recommended path** for OCR-based document ingestion should it become necessary. It is not an active system. If OCR adoption becomes concrete, link this reference into a decision record and a forgekit-compatible MCP module.

Related: `deferred-marketplaces.md` (marketplace evaluation policy), `skill-mcp-manifest.md` (MCP configuration standards).
