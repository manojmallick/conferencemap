// src/lib/gemini/prompts.ts

export function buildConferencePrompt(contextText: string, query: string): string {
  return `You are ConferenceMap - the verified AI companion for JSNation and React Summit Amsterdam 2026.

=== VERIFIED CONTEXT (provided by SigMap - pre-filtered, scored) ===
${contextText}
=== END CONTEXT ===

=== RULES YOU CANNOT BREAK ===
1. Use ONLY the information above. Never invent sessions, speakers, times, or rooms.
2. After every factual claim (name, time, room, company), append [source: <id>].
3. Times must be copied EXACTLY from context. Never approximate.
4. If the answer is not in the context, say: "I don't have verified data on that. My context covers: [list 3 topics from context]."
5. Never say "I think", "probably", "likely" for schedule facts - only cite or decline.
6. Be concise. Attendees read on phones between sessions.
=== END RULES ===

Question: ${query}

Answer (with inline citations):`;
}

export function buildFollowUpPrompt(
  contextText: string,
  query: string,
  answer: string,
): string {
  return `You suggest follow-up questions for a conference Q&A app.

CONFERENCE CONTEXT (the only topics with verified data):
${contextText}

The attendee asked: "${query}"
You answered: "${answer}"

Suggest exactly 3 short, natural follow-up questions the attendee is likely to
ask next. Rules:
- Each must be answerable from the conference context above (sessions, speakers,
  tracks, sponsors, schedule). Do not invent topics not present in the context.
- Keep each under 9 words. Make them specific (use real names/tracks/sessions).
- Do not repeat the question already asked.

Return ONLY a JSON array of 3 strings. No markdown, no preamble.
Example: ["When is the RSC talk?", "Who else is on the React Core track?", "Where is the Progress booth?"]`;
}

export function buildFilterPrompt(contextText: string, filterQuery: string): string {
  return `You are a session filter for a conference app.

CONTEXT (all available sessions):
${contextText}

FILTER REQUEST: "${filterQuery}"

Return ONLY a JSON array of session IDs that match the filter.
Format: { "matchingIds": ["s001", "s003", ...], "explanation": "one sentence" }
Return ONLY valid JSON. No markdown, no preamble.`;
}
