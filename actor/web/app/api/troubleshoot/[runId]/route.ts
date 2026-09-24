import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

type Progress = {
    stage: string;
    sources: number;
};

export async function GET(
    request: Request,
    context: {
        params: Promise<{
            runId: string;
        }>;
    },
) {
    try {
        const { runId } = await context.params;

        if (!runId) {
            return NextResponse.json(
                {
                    error: 'Run ID is required.',
                },
                { status: 400 },
            );
        }

        if (!process.env.APIFY_TOKEN) {
            return NextResponse.json(
                {
                    error:
                        'APIFY_TOKEN is not configured.',
                },
                { status: 500 },
            );
        }

        /*
         * Get the current Apify Actor run.
         */
        const run = await client
            .run(runId)
            .get();

        if (!run) {
            return NextResponse.json(
                {
                    error:
                        'FIX run was not found.',
                },
                { status: 404 },
            );
        }

        /*
         * Read the tiny progress record.
         *
         * This is intentionally much lighter
         * than reading the entire Actor log.
         */
        const progressRecord =
            await client
                .run(runId)
                .keyValueStore()
                .getRecord('PROGRESS');

        const progress =
            (progressRecord?.value as
                | Progress
                | undefined) ?? {
                stage: 'starting',
                sources: 0,
            };

        /*
         * Actor finished successfully.
         */
        if (run.status === 'SUCCEEDED') {
            /*
             * First try the OUTPUT key-value record.
             */
            const outputRecord =
                await client
                    .run(runId)
                    .keyValueStore()
                    .getRecord('OUTPUT');

            if (outputRecord?.value) {
                return NextResponse.json({
                    status: 'SUCCEEDED',
                    progress: {
                        stage: 'complete',
                        sources:
                            progress.sources,
                    },
                    result:
                        outputRecord.value,
                });
            }

            /*
             * Fallback to the default dataset.
             */
            if (run.defaultDatasetId) {
                const { items } =
                    await client
                        .dataset(
                            run.defaultDatasetId,
                        )
                        .listItems();

                if (items.length > 0) {
                    return NextResponse.json({
                        status: 'SUCCEEDED',
                        progress: {
                            stage: 'complete',
                            sources:
                                progress.sources,
                        },
                        result: items[0],
                    });
                }
            }

            return NextResponse.json(
                {
                    error:
                        'FIX completed but returned no diagnosis.',
                },
                { status: 500 },
            );
        }

        /*
         * Actor failed or was stopped.
         */
        if (
            run.status === 'FAILED' ||
            run.status === 'ABORTED' ||
            run.status === 'TIMED-OUT'
        ) {
            return NextResponse.json({
                status: run.status,
                progress: {
                    stage: 'error',
                    sources:
                        progress.sources,
                },
            });
        }

        /*
         * Actor is still running.
         */
        return NextResponse.json({
            status: run.status,
            progress,
        });
    } catch (error) {
        console.error(
            'FIX STATUS ERROR:',
            error,
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'Unable to check FIX status.',
            },
            { status: 500 },
        );
    }
}