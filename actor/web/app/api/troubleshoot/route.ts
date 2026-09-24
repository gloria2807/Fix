import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        if (!body.problem?.trim()) {
            return NextResponse.json(
                { error: 'Problem description is required.' },
                { status: 400 },
            );
        }

        if (!process.env.APIFY_TOKEN) {
            throw new Error('APIFY_TOKEN is not configured.');
        }

        if (!process.env.FIX_ACTOR_ID) {
            throw new Error('FIX_ACTOR_ID is not configured.');
        }

        console.log('Starting FIX Actor:', process.env.FIX_ACTOR_ID);

        const run = await client
            .actor(process.env.FIX_ACTOR_ID)
            .call({
                problem: body.problem,
                equipment: body.equipment ?? 'unknown',
                model: body.model ?? '',
                location: body.location ?? '',
                imageUrl: body.imageUrl ?? '',
            });

        console.log('FIX Actor finished:', {
            status: run.status,
            runId: run.id,
            datasetId: run.defaultDatasetId,
        });

        if (run.status !== 'SUCCEEDED') {
            throw new Error(
                `FIX Actor finished with status: ${run.status}`,
            );
        }

        if (!run.defaultDatasetId) {
            throw new Error('FIX Actor did not return a dataset.');
        }

        const { items } = await client
            .dataset(run.defaultDatasetId)
            .listItems();

        console.log('FIX dataset items:', items.length);

        if (!items.length) {
            throw new Error('FIX Actor returned no diagnosis.');
        }

        return NextResponse.json(items[0]);
    } catch (error) {
        console.error('FIX API ERROR:', error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'FIX could not complete the diagnosis.',
            },
            { status: 500 },
        );
    }
}