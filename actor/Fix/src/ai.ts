import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import type { ResearchSource } from './types.js';

const openrouter = createOpenRouter({
    baseURL: 'https://openrouter.apify.actor/api/v1',
    apiKey: 'api-key-not-required',
    headers: {
        Authorization: `Bearer ${process.env.APIFY_TOKEN}`,
    },
});

interface DiagnosisResult {
    equipment: string;
    model: string;
    confidence: number;
    summary: string;
    likelyIssues: string[];
    firstAction: string;
    steps: string[];
    questions: string[];
    parts: string[];
    serviceNeeded: boolean;
}

function extractJson(text: string): DiagnosisResult {
    const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1) {
        throw new Error(`AI did not return valid JSON: ${text}`);
    }

    const jsonText = cleaned.slice(start, end + 1);

    return JSON.parse(jsonText) as DiagnosisResult;
}

export async function diagnose({
    problem,
    equipment,
    model,
    sources,
}: {
    problem: string;
    equipment?: string;
    model?: string;
    sources: ResearchSource[];
}) {
    const sourceText = sources
        .slice(0, 8)
        .map(
            (source, index) =>
                `[SOURCE ${index + 1}]
Title: ${source.title}
URL: ${source.url}
Information: ${source.snippet}`,
        )
        .join('\n\n');

    const { text } = await generateText({
        model: openrouter('google/gemini-2.5-flash'),

        system: `
You are FIX, a practical equipment troubleshooting assistant.

Your job is to help an ordinary person understand and safely troubleshoot
an equipment problem.

Rules:
- Do not invent facts.
- Use the research provided.
- Give the safest useful first action.
- Distinguish likely causes from confirmed facts.
- Ask a follow-up question when necessary.
- Recommend professional service for dangerous electrical, fuel,
  refrigeration, high-voltage or mechanical work.
- Never instruct users to perform dangerous repairs.
- Keep the answer concise and practical.

Return ONLY valid JSON.
Do not include markdown.
Do not include explanations before or after the JSON.
Do not include "User Safety", "Analysis", or any other text outside the JSON.

The JSON must have exactly these fields:

{
  "equipment": "string",
  "model": "string",
  "confidence": 0.0,
  "summary": "string",
  "likelyIssues": ["string"],
  "firstAction": "string",
  "steps": ["string"],
  "questions": ["string"],
  "parts": ["string"],
  "serviceNeeded": false
}
        `,

        prompt: `
PROBLEM:
${problem}

EQUIPMENT:
${equipment ?? 'Unknown'}

MODEL:
${model ?? 'Unknown'}

RESEARCH:
${sourceText}

Diagnose the problem using the available evidence.

Prioritize the safest and simplest action the user can take first.
        `,
    });

    return extractJson(text);
}