import { Actor, log } from 'apify';

import type { FixInput } from './types.js';
import { researchWeb } from './research.js';
import { diagnose } from './ai.js';

await Actor.init();

try {
    const input = (await Actor.getInput()) as FixInput | null;

    if (!input?.problem) {
        throw new Error('A problem description is required.');
    }

    log.info('FIX starting diagnosis...');

    const equipment =
        input.equipment && input.equipment !== 'unknown'
            ? input.equipment
            : 'unknown';

    const queries = [
    `${equipment} ${input.model ?? ''} ${input.problem} troubleshooting manual`,
];

    log.info('Researching relevant sources...');

    const sources = await researchWeb(queries);

    log.info(`Found ${sources.length} research sources.`);

    const diagnosis = await diagnose({
        problem: input.problem,
        equipment,
        model: input.model,
        sources,
    });

    const output = {
        ...diagnosis,
        sources,
    };

    await Actor.pushData(output);

    await Actor.setValue('OUTPUT', output);

    log.info('FIX diagnosis complete.');
} catch (error) {
    log.exception(error as Error, 'FIX failed');
    throw error;
} finally {
    await Actor.exit();
}