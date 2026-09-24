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

    /*
     * ----------------------------------------
     * STEP 1
     * Understand the problem and determine
     * what information FIX needs.
     * ----------------------------------------
     */

    await setProgress(
        'identifying',
    );

    const equipment =
        input.equipment &&
        input.equipment !== 'unknown'
            ? input.equipment
            : 'unknown';

    const plan =
        await planResearch({
            problem:
                input.problem,
            equipment,
            model:
                input.model,
        });

    log.info(
        `FIX AGENT selected ${plan.searches.length} research queries.`,
    );

    /*
     * ----------------------------------------
     * STEP 2
     * Research the actual problem.
     * ----------------------------------------
     */

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

    /*
     * The research has been retrieved.
     */

    await setProgress(
        'documentation',
        sources.length,
    );

    /*
     * ----------------------------------------
     * STEP 3
     * Evaluate the evidence.
     * ----------------------------------------
     */

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
            sources,
        });

    /*
     * ----------------------------------------
     * STEP 4
     * Select the safest first action.
     * ----------------------------------------
     */

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

    /*
     * Save the final result to the dataset.
     */

    await Actor.pushData(
        output,
    );

    /*
     * Also save it to the run's Key-Value
     * Store so the web app can retrieve it
     * quickly.
     */

    await Actor.setValue(
        'OUTPUT',
        output,
    );

    /*
     * Tell the frontend that FIX is finished.
     */

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

    /*
     * Tell the frontend that the run failed.
     */

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