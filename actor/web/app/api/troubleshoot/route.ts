import { NextResponse } from 'next/server';
import { ApifyClient } from 'apify-client';

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

export async function POST(
    request: Request,
) {
    try {
        const body = await request.json();

        if (!body.problem?.trim()) {
            return NextResponse.json(
                {
                    error:
                        'Problem description is required.',
                },
                { status: 400 },
            );
        }

        if (!process.env.APIFY_TOKEN) {
            throw new Error(
                'APIFY_TOKEN is not configured.',
            );
        }

        if (!process.env.FIX_ACTOR_ID) {
            throw new Error(
                'FIX_ACTOR_ID is not configured.',
            );
        }

        console.log(
            'Starting FIX Actor:',
            process.env.FIX_ACTOR_ID,
        );

        /*
         * IMPORTANT:
         *
         * start() starts the Actor and returns
         * immediately.
         *
         * We do NOT use call() here because
         * call() waits for the entire Actor.
         */

        const run = await client
            .actor(process.env.FIX_ACTOR_ID)
            .start({
                problem: body.problem,
                equipment:
                    body.equipment ?? 'unknown',
                model: body.model ?? '',
                location:
                    body.location ?? '',
                imageUrl:
                    body.imageUrl ?? '',
            });

        console.log(
            'FIX Actor started:',
            {
                runId: run.id,
                status: run.status,
            },
        );

        return NextResponse.json({
            runId: run.id,
        });
    } catch (error) {
        console.error(
            'FIX API ERROR:',
            error,
        );

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'FIX could not start the diagnosis.',
            },
            { status: 500 },
        );
    }
}