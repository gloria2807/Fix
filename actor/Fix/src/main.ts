import { Actor, log } from 'apify';

import type { FixInput } from './types.js';

import {
    diagnose,
    planResearch,
} from './ai.js';

import {
    researchWeb,
} from './research.js';

await Actor.init();

async function setProgress(
    stage: string,
    sources = 0,
) {
    await Actor.setValue(
        'PROGRESS',
        {
            stage,
            sources,
        },
    );
}

try {
    const input =
        (await Actor.getInput()) as
            | FixInput
            | null;

    if (!input?.problem?.trim()) {
        throw new Error(
            'A problem description is required.',
        );
    }

    log.info(
        'FIX AGENT starting.',
    );

    await setProgress(
        'identifying',
    );

    const equipment =
        input.equipment &&
        input.equipment !== 'unknown'
            ? input.equipment
            : 'unknown';

    if (input.imageData) {
        log.info(
            'FIX AGENT received an image for visual analysis.',
        );
    }

    const plan =
        await planResearch({
            problem:
                input.problem,
            equipment,
            model:
                input.model,
            imageData:
                input.imageData,
        });

    if (plan.visualAnalysis) {
        log.info(
            `FIX AGENT visual analysis: ${JSON.stringify(
                plan.visualAnalysis,
            )}`,
        );
    }

    log.info(
        `FIX AGENT selected ${plan.searches.length} research queries.`,
    );

    await setProgress(
        'researching',
    );

    const sources =
        await researchWeb(
            plan.searches,
        );

    log.info(
        `FIX AGENT found ${sources.length} research sources.`,
    );

    await setProgress(
        'documentation',
        sources.length,
    );

    await setProgress(
        'evaluating',
        sources.length,
    );

    const diagnosis =
        await diagnose({
            problem:
                input.problem,
            equipment,
            model:
                input.model,
            visualAnalysis:
                plan.visualAnalysis,
            sources,
        });

    await setProgress(
        'sufficient',
        sources.length,
    );

    await setProgress(
        'action',
        sources.length,
    );

    const output = {
        ...diagnosis,
        sources,
    };

    await Actor.pushData(
        output,
    );

    await Actor.setValue(
        'OUTPUT',
        output,
    );

    await setProgress(
        'complete',
        sources.length,
    );

    log.info(
        'FIX AGENT diagnosis complete.',
    );
} catch (error) {
    log.exception(
        error as Error,
        'FIX AGENT failed.',
    );

    await Actor.setValue(
        'PROGRESS',
        {
            stage: 'error',
            sources: 0,
        },
    );

    throw error;
} finally {
    await Actor.exit();
}