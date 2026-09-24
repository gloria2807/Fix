import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

import type {
    Diagnosis,
    ResearchSource,
} from './types.js';

const openrouter = createOpenRouter({
    baseURL:
        'https://openrouter.apify.actor/api/v1',
    apiKey: 'api-key-not-required',
    headers: {
        Authorization: `Bearer ${process.env.APIFY_TOKEN}`,
    },
});

interface ResearchPlan {
    searches: string[];
}

function extractJson<T>(text: string): T {
    const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1) {
        throw new Error(
            `AI did not return valid JSON: ${text}`,
        );
    }

    const jsonText = cleaned.slice(
        start,
        end + 1,
    );

    try {
        return JSON.parse(jsonText) as T;
    } catch (error) {
        throw new Error(
            `AI returned invalid JSON: ${
                error instanceof Error
                    ? error.message
                    : 'Unknown JSON error'
            }`,
        );
    }
}

/**
 * AI STEP 1
 *
 * Decide what information FIX needs to research.
 *
 * This is what makes the workflow agentic:
 * FIX does not use one hard-coded search query.
 * The AI decides what it needs to investigate.
 */
export async function planResearch({
    problem,
    equipment,
    model,
}: {
    problem: string;
    equipment: string;
    model?: string;
}): Promise<ResearchPlan> {
    const prompt = `
You are the research planner inside FIX, an AI troubleshooting agent.

The user has a real equipment problem.

Your job is to determine the minimum external information FIX needs before it can recommend a safe first troubleshooting action.

USER PROBLEM:
${problem}

KNOWN EQUIPMENT:
${equipment}

MODEL:
${model || 'Unknown'}

Return ONLY valid JSON.

Required format:

{
  "searches": [
    "specific search query"
  ]
}

Rules:

- Return 1 or 2 searches only.
- Make each search specific to the user's actual problem.
- Focus on the symptom and equipment.
- If a model is known, include it.
- Prefer technical documentation, manuals, manufacturer support and reliable troubleshooting information.
- Do not search for generic AI advice.
- Do not explain your reasoning.
- Keep each search concise.
`;

    const { text } = await generateText({
        model: openrouter(
            'google/gemini-2.5-flash',
        ),
        prompt,
    });

    const plan =
        extractJson<ResearchPlan>(text);

    const searches = Array.isArray(
        plan.searches,
    )
        ? plan.searches
              .filter(
                  (search) =>
                      typeof search ===
                          'string' &&
                      search.trim().length > 0,
              )
              .slice(0, 2)
        : [];

    if (searches.length === 0) {
        throw new Error(
            'FIX could not determine what information to research.',
        );
    }

    return {
        searches,
    };
}

/**
 * AI STEP 2
 *
 * Evaluate the retrieved research and turn it
 * into a practical troubleshooting result.
 */
export async function diagnose({
    problem,
    equipment,
    model,
    sources,
}: {
    problem: string;
    equipment: string;
    model?: string;
    sources: ResearchSource[];
}): Promise<Diagnosis> {
    const sourceText =
        sources.length > 0
            ? sources
                  .slice(0, 8)
                  .map(
                      (
                          source,
                          index,
                      ) =>
                          `[SOURCE ${
                              index + 1
                          }]
Title: ${source.title}
Type: ${source.sourceType}
URL: ${source.url}
Snippet: ${source.snippet}`,
                  )
                  .join('\n\n')
            : 'No external sources were found.';

    const prompt = `
You are FIX, an AI troubleshooting agent.

Your job is to turn researched technical information into a safe, practical first troubleshooting action.

USER PROBLEM:
${problem}

KNOWN EQUIPMENT:
${equipment}

MODEL:
${model || 'Unknown'}

RESEARCHED SOURCES:
${sourceText}

Return ONLY valid JSON.

Required format:

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

Rules:

1. Use the research as evidence.
2. Do not invent facts that are not supported by the user's problem or the research.
3. Do not claim certainty when the evidence is uncertain.
4. Prefer manufacturer and manual information when available.
5. Give ONE clear safest first action.
6. Make troubleshooting steps practical and easy for an ordinary user to understand.
7. Do not provide dangerous electrical, fuel-system, refrigerant, high-voltage or other hazardous repair instructions.
8. If professional service is needed, say so.
9. Ask follow-up questions only when they would materially change the troubleshooting path.
10. Keep the response concise.
11. The user needs to know what to do next, not just what might be wrong.
`;

    const { text } = await generateText({
        model: openrouter(
            'google/gemini-2.5-flash',
        ),
        prompt,
    });

    return extractJson<Diagnosis>(text);
}