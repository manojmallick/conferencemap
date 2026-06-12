<div align="center">

# ◆ ConferenceMap — Verified by SigMap

**The AI conference companion that eliminates hallucination — every answer sourced, cited, and token-optimised.**

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-Cloud_Run-10B981?style=for-the-badge)](https://conferencemap-908307939543.europe-west4.run.app)

[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![KendoReact](https://img.shields.io/badge/KendoReact-Progress-FF6358?logo=progress&logoColor=white)](https://www.telerik.com/kendo-react-ui)
[![Gemini 2.5 Flash](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Google Cloud Run](https://img.shields.io/badge/Cloud_Run-europe--west4-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Built for the **Progress × GitNation Hackathon** · JSNation + React Summit Amsterdam 2026

</div>

---

## Why it's different

Generic chatbots hallucinate conference details — wrong speaker, wrong time, wrong room.
ConferenceMap is **not a chatbot wrapper, it's a verification layer**. SigMap pre-filters the
entire conference corpus to only the relevant chunks *before any token reaches Gemini*, then
verifies every factual claim in the answer against those chunks. The whole pipeline is
transparent: input tokens, output tokens, latency, cost, citations, and a faithfulness score
are shown live on every reply.

| | |
|---|---|
| **~60–97%** | input-token reduction by SigMap (scales with corpus size) |
| **0.3–2s** | first-token latency (Gemini 2.5 Flash, streaming) |
| **100%** | of factual claims cited and verified post-generation |
| **0** | hallucinations — the model declines when context is missing |

## Features

- **Ask** — conversational Q&A with verified, cited answers, a live trust panel, and smart follow-up suggestions
- **Sessions** — KendoReact Grid with natural-language AI filtering
- **Agenda** — personal time-blocked schedule
- **Organiser** — engagement analytics + coverage-gap detection
- **For Judges** — a built-in [`/judges`](https://conferencemap-908307939543.europe-west4.run.app/judges) walkthrough of what to try and what to look for

## Live demo

▶ **https://conferencemap-908307939543.europe-west4.run.app**

## Quick start

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY (must start with "AIza") from aistudio.google.com/apikey
npm run dev                  # http://localhost:3000
```

> **KendoReact license:** the Grid/TileLayout show an "Invalid license" watermark until a
> (free) Telerik key is activated. Drop `telerik-license.txt` in the project root and run
> `npx kendo-ui-license activate`. The key is gitignored.

### Configuration

| Env var | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | — | Gemini API key (starts with `AIza`) |
| `LLM_FOLLOWUPS` | `true` | `true` = Gemini-generated follow-ups; `false` = instant templates |

## Architecture

![Architecture](architecture.png)

A single Next.js 15 process — no separate API server, no vector DB. The TF-IDF index lives in
module memory, built once at cold start and reused per request. Full detail in
[ARCHITECTURE.md](ARCHITECTURE.md).

```
Browser (KendoReact)
  → POST /api/query  (SSE)
Next.js API route
  ├─ SigMapIndex.assembleContext()   in-memory TF-IDF → preflight
  ├─ Gemini 2.5 Flash streaming      @google/genai → first_token, text…
  ├─ verifyAnswer()                  faithfulness check → final_metrics
  └─ follow-ups (LLM or template)    → suggestions
  → SSE events → TokenPanel UI
```

## Tech stack

- **Next.js 15** — App Router, API routes, SSE streaming, standalone build
- **KendoReact** — Grid, TileLayout, ProgressBar, Loader, Buttons, Input
- **SigMap** — TF-IDF context assembly + post-generation faithfulness verification
- **@google/genai** — Gemini 2.5 Flash, streaming, usageMetadata, thinking tokens
- **Google Stitch** — UX design ([`design/`](design/))
- **Google Cloud Run** (europe-west4) — containerised, `min-instances=1`

## Deploy

```bash
gcloud run deploy conferencemap --source . --region europe-west4 \
  --allow-unauthenticated --min-instances 1 --memory 512Mi --cpu-boost \
  --set-env-vars "GEMINI_API_KEY=your_key_here"
```

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — system design, SSE event contract, layers
- [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) — color tokens, typography, component patterns
- [DECK.pdf](DECK.pdf) — pitch deck
- [`design/`](design/) — Google Stitch reference screens

## Author

**Manoj Mallick** — [@manojmallick](https://github.com/manojmallick) · LearnHubPlay
Built on [SigMap](https://github.com/manojmallick/sigmap), an open-source context verification layer.

## License

[MIT](LICENSE) — knowledge about your conference should be free.
