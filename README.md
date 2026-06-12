# ConferenceMap — Verified by SigMap

The AI-powered conference companion that eliminates hallucination — every answer
verified, cited, and token-optimised by **SigMap**.

Built for the **Progress × GitNation Hackathon** (JSNation + React Summit Amsterdam 2026).

## What it does

ConferenceMap combines SigMap's context-verification layer with KendoReact's
components to answer questions about a conference using only real, verified event
data. Every reply shows live token metrics, citations, and a faithfulness score.

- **Ask** — conversational Q&A with verified, cited answers and a live trust panel
- **Sessions** — KendoReact Grid with natural-language AI filtering
- **Agenda** — personal time-blocked schedule
- **Organiser** — engagement analytics + coverage-gap detection

## Stack

- **Next.js 15** (App Router, standalone build)
- **KendoReact** — Grid, TileLayout, ProgressBar, Loader, Buttons, Input
- **SigMap** — TF-IDF context assembly (~80–97% token reduction) + faithfulness verification
- **@google/genai** — Gemini 2.5 Flash, streaming SSE, usageMetadata
- **Google Cloud Run** (europe-west4)

## Quick start

```bash
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY from aistudio.google.com/apikey
npm run dev                  # http://localhost:3000
```

## Architecture

```
Browser (KendoReact)
  → SSE stream
Next.js API route /api/query
  ├─ SigMapIndex.assembleContext()   in-memory TF-IDF, built once at startup
  ├─ Gemini 2.5 Flash streaming      @google/genai
  └─ verifyAnswer()                  post-generation faithfulness check
  → SSE events → TokenPanel UI
```

## Deploy

```bash
gcloud run deploy conferencemap --source . --region europe-west4 \
  --allow-unauthenticated --min-instances 1 --memory 512Mi --cpu-boost \
  --set-env-vars "GEMINI_API_KEY=your_key_here"
```

## Design

UX designed with Google Stitch — reference screens and the design system live in
[`design/`](design/).
