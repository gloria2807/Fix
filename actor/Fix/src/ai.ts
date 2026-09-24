import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';

import type {
    Diagnosis,
    ResearchSource,
    VisualAnalysis,
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
    visualAnalysis?: VisualAnalysis;
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

export async function planResearch({
    problem,
    equipment,
    model,
    imageData,
}: {
    problem: string;
    equipment: string;
    model?: string;
    imageData?: string;
}): Promise<ResearchPlan> {
    const prompt = `
You are the research planner inside FIX, an AI troubleshooting agent.

The user has a real equipment problem.

Your job is to:
1. Understand the user's reported problem.
2. If an image is provided, inspect it for useful visual evidence.
3. Identify the equipment and model when possible.
4. Identify visible symptoms or clues.
5. Determine the minimum external information FIX needs before recommending a safe first troubleshooting action.
6. Create 1 or 2 highly specific research searches.

USER PROBLEM:
${problem}

KNOWN EQUIPMENT:
${equipment}

MODEL:
${model || 'Unknown'}

${
    imageData
        ? `An image of the equipment is attached. Inspect it carefully.`
        : 'No image was provided.'
}

Return ONLY valid JSON.

Required format:

{
  "searches": [
    "specific search query"
  ],
  "visualAnalysis": {
    "equipment": "string",
    "model": "string",
    "confidence": 0.0,
    "visibleSymptoms": ["string"],
    "visualClues": ["string"]
  }
}

Rules:

- Return 1 or 2 searches only.
- Make each search specific to the user's actual problem.
- Focus on the symptom and equipment.
- If a model is known or can reasonably be read from the image, include it.
- Prefer technical documentation, manuals, manufacturer support and reliable troubleshooting information.
- Do not search for generic AI advice.
- Do not invent a model from an unclear image.
- If the image does not provide useful information, say so in visualClues.
- Do not provide repair instructions here.
- Do not explain your reasoning.
- Keep each search concise.
`;

    const content: Array<
        | {
              type: 'text';
              text: string;
          }
        | {
              type: 'image';
              image: string;
          }
    > = [
        {
            type: 'text',
            text: prompt,
        },
    ];

    if (imageData) {
        content.push({
            type: 'image',
            image: imageData,
        });
    }

    const { text } = await generateText({
        model: openrouter(
            'google/gemini-2.5-flash',
        ),
        messages: [
            {
                role: 'user',
                content,
            },
        ],
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
        visualAnalysis:
            plan.visualAnalysis,
    };
}

export async function diagnose({
    problem,
    equipment,
    model,
    visualAnalysis,
    sources,
}: {
    problem: string;
    equipment: string;
    model?: string;
    visualAnalysis?: VisualAnalysis;
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

    const visualText =
        visualAnalysis
            ? `
VISUAL ANALYSIS:
Equipment seen: ${
                  visualAnalysis.equipment
              }
Model seen: ${
                  visualAnalysis.model ||
                  'Unknown'
              }
Visual confidence: ${
                  visualAnalysis.confidence
              }

Visible symptoms:
${
    visualAnalysis.visibleSymptoms
        .map(
            (item) => `- ${item}`,
        )
        .join('\n') ||
    '- None identified'
}

Visual clues:
${
    visualAnalysis.visualClues
        .map(
            (item) => `- ${item}`,
        )
        .join('\n') ||
    '- None identified'
}
`
            : `
VISUAL ANALYSIS:
No image was provided.
`;

    const prompt = `
You are FIX, an AI troubleshooting agent.

Your job is to turn researched technical information into a safe, practical first troubleshooting action.

USER PROBLEM:
${problem}

KNOWN EQUIPMENT:
${equipment}

MODEL:
${model || 'Unknown'}

${visualText}

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
2. Use visual evidence only when it is actually supported by the image analysis.
3. Do not invent facts that are not supported by the user's problem, visual analysis or research.
4. Do not claim certainty when the evidence is uncertain.
5. Prefer manufacturer and manual information when available.
6. Give ONE clear safest first action.
7. Make troubleshooting steps practical and easy for an ordinary user to understand.
8. Do not provide dangerous electrical, fuel-system, refrigerant, high-voltage or other hazardous repair instructions.
9. Clearly separate safe user checks from anything requiring a technician.
10. If professional service is needed, say so.
11. Ask follow-up questions only when they would materially change the troubleshooting path.
12. Keep the response concise.
13. The user needs to know what to do next, not just what might be wrong.
`;

    const { text } = await generateText({
        model: openrouter(
            'google/gemini-2.5-flash',
        ),
        prompt,
    });

    return extractJson<Diagnosis>(text);
}