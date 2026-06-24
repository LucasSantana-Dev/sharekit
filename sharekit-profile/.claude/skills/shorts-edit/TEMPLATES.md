# Niche templates (PT-BR)

One video = one idea. Hook on screen within the first 2 seconds, always. Target 25–45s.

## Tom de voz (guia-de-marca — ABSOLUTO)

A Criativaria é **uma amiga que entende de tech e te convida pra entrar, não uma professora**. Informal, direta, acolhedora, inteligente, com personalidade. Nunca: "é muito simples, qualquer um aprende", "pra quem não sabe nada de...", "aprenda X em 5 minutos", tom de especialista no pedestal, jargão sem contexto. Vocabulário: pertencimento, tech (minúsculo), curiosidade, jornada, "pra você". Foco em identidade/pertencimento ("você faz parte disso"), não em ensino ("veja como fazer"). TODA copy de hook/CTA/card passa por esse filtro.

## Structure (all niches)

| Segment | Time | Content |
|---------|------|---------|
| Hook | 0–2s | Text overlay + the most interesting frame/claim |
| Body | 2s–N | The actual tip/story/news — constant cut cadence, no dead air, no transitions |
| Payoff | last 5s | Conclusion + CTA |

Style contract (no transitions, one pace, bold type, abstract→visual, integrated captions, cinematic grade): see [STYLE.md](STYLE.md).

## Retention structure (research-backed, 2026)

- **Hook delivered by 2.5s** — first 3s decide ~80% of completion; >25% drop in 0–3s = throttled reach.
- **Pattern interrupt every 3–5s** in the body — within our style rules that means: keyword card, evidence punch-in (hard cut to tighter crop), or full-screen info card. Rotate types; never crossfades or speed changes.
- **Payoff in the last 15–25%** of runtime; **CTA in the last 3–5s**, woven into the narrative ("salva pra não esquecer") rather than bolted on — narrative CTAs convert 2–3x better.
- **Loopable ending:** make the last ~0.5s visually match the opening frame, or end on a line that resolves into the hook on rewatch.
- **Captions:** max 2 lines / ~45 chars on screen; each chunk 1–3s (2–2.5s optimal). 60%+ watch muted — the video must work with sound off.

---

## 1. dicas-de-estudo (studying tips)

**Tone:** direto, prático, "professor que vai direto ao ponto".

**Hook formulas (voz: convite, nunca professora):**
- "Se estudar parece mais difícil do que devia, isso é pra você."
- "Ninguém nasce sabendo estudar. Literalmente ninguém."
- "O jeito que eu estudo mudou quando eu descobri isso:"
- "O método que ninguém te ensinou na escola"

**Body pattern:** numbered tips (max 3 per video — if more, split into multiple shorts). Each tip = claim → why it works (1 sentence) → how to apply (1 sentence). Each technique name appears as a Cellbit-style keyword card the moment it's spoken (STYLE.md).

**Caption style:** default white/black outline; highlight the technique name in yellow (`<font color="#FFD400">` in ASS, or a second drawtext).

**CTA:** "Salva esse vídeo pra não esquecer" / "Comenta qual técnica você vai testar".

---

## 2. motivacao-dev (coding motivation)

**Tone:** pessoal, história real, sem coach-falso. Música carrega o ritmo.

**Hook formulas:**
- "Eu quase desisti de programar quando..."
- "Ninguém te conta isso sobre ser dev:"
- "0 vagas respondidas. Foi assim que eu virei o jogo:"
- "Todo dev sênior já foi péssimo. Olha:"

**Body pattern:** narrative arc — struggle → turning point → result. Same cut cadence as the rest of the video (style rule: one pace); emphasize the turning point with a hard cut to a punched-in framing or a full-screen info card, never a speed change.

**Caption style:** larger font, fewer words per line (2–4), synced to speech beats, scene-integrated placement when possible (STYLE.md). Music at -18dB under voice (export.sh default works).

**CTA:** "Marca aquele amigo que precisa ouvir isso" / "Me segue pra mais".

---

## 3. noticias-dev (coding news)

**Tone:** urgente, factual, opinião curta no final. Credibilidade importa.

**Hook formulas:**
- "O GitHub acabou de lançar..."
- "ALERTA: isso muda como você usa <X>"
- "Saiu hoje: <ferramenta> agora faz <Y>"
- "Se você usa <X>, presta atenção:"

**Body pattern:** what happened (2 sentences) → why it matters for devs (2 sentences) → quick take/opinion (1 sentence). Constant cadence; show the actual feature/release notes as evidence punch-ins, and turn stats or list items into Patagonia-style full-screen info cards (STYLE.md).

**Required:** source credit lower-third in the last segment (drawtext recipe in REFERENCE.md), e.g. "Fonte: blog.github.com". Never publish news without the source visible.

**Caption style:** default; highlight product/version names in yellow.

**CTA:** "Segue pra não perder a próxima" / "Já testou? Comenta aí".
