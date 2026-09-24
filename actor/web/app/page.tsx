'use client';

import {
    ChangeEvent,
    FormEvent,
    useRef,
    useState,
} from 'react';

import AgentProgress from '@/components/AgentProgress';

type Progress = {
    stage: string;
    sources: number;
};

type Diagnosis = {
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
    sources: {
        title: string;
        url: string;
        snippet: string;
        sourceType: string;
    }[];
};

type RunResponse = {
    status: string;
    progress?: Progress;
    result?: Diagnosis;
    error?: string;
};

const POLL_INTERVAL = 700;

function formatEquipment(
    value: string,
) {
    return value
        .replace(/_/g, ' ')
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase(),
        );
}

async function compressImage(
    file: File,
): Promise<string> {
    const bitmap =
        await createImageBitmap(
            file,
        );

    const maxDimension = 1200;

    const scale = Math.min(
        1,
        maxDimension /
            Math.max(
                bitmap.width,
                bitmap.height,
            ),
    );

    const width = Math.max(
        1,
        Math.round(
            bitmap.width * scale,
        ),
    );

    const height = Math.max(
        1,
        Math.round(
            bitmap.height * scale,
        ),
    );

    const canvas =
        document.createElement(
            'canvas',
        );

    canvas.width = width;
    canvas.height = height;

    const context =
        canvas.getContext('2d');

    if (!context) {
        throw new Error(
            'Could not process the image.',
        );
    }

    context.drawImage(
        bitmap,
        0,
        0,
        width,
        height,
    );

    bitmap.close();

    let quality = 0.78;
    let dataUrl =
        canvas.toDataURL(
            'image/jpeg',
            quality,
        );

    /*
     * Keep the image small enough to
     * travel safely through the existing
     * API → Apify Actor flow.
     */
    while (
        dataUrl.length >
            1_200_000 &&
        quality > 0.5
    ) {
        quality -= 0.08;

        dataUrl =
            canvas.toDataURL(
                'image/jpeg',
                quality,
            );
    }

    if (
        dataUrl.length >
        1_500_000
    ) {
        throw new Error(
            'This image is too large. Please choose a smaller photo.',
        );
    }

    return dataUrl;
}

export default function Home() {
    const [
        problem,
        setProblem,
    ] = useState('');

    const [
        imageData,
        setImageData,
    ] = useState<string | null>(
        null,
    );

    const [
        imageName,
        setImageName,
    ] = useState('');

    const [
        progress,
        setProgress,
    ] = useState<Progress>({
        stage: 'starting',
        sources: 0,
    });

    const [
        result,
        setResult,
    ] = useState<Diagnosis | null>(
        null,
    );

    const [
        isRunning,
        setIsRunning,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState<string | null>(
        null,
    );

    const cameraInputRef =
        useRef<HTMLInputElement>(
            null,
        );

    const imageInputRef =
        useRef<HTMLInputElement>(
            null,
        );

    async function handleImage(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (
            !file.type.startsWith(
                'image/',
            )
        ) {
            setError(
                'Please choose an image file.',
            );
            return;
        }

        try {
            setError(null);

            const compressed =
                await compressImage(
                    file,
                );

            setImageData(
                compressed,
            );

            setImageName(
                file.name,
            );
        } catch (imageError) {
            console.error(
                'IMAGE ERROR:',
                imageError,
            );

            setError(
                imageError instanceof
                    Error
                    ? imageError.message
                    : 'Could not process the image.',
            );
        } finally {
            event.target.value = '';
        }
    }

    function removeImage() {
        setImageData(null);
        setImageName('');
    }

    async function submit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            !problem.trim() ||
            isRunning
        ) {
            return;
        }

        setError(null);
        setResult(null);
        setIsRunning(true);

        try {
            const response =
                await fetch(
                    '/api/troubleshoot',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type':
                                'application/json',
                        },
                        body: JSON.stringify({
                            problem:
                                problem.trim(),
                            equipment:
                                'unknown',
                            model: '',
                            location:
                                'Lagos, Nigeria',
                            imageData:
                                imageData ??
                                undefined,
                        }),
                    },
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ??
                        'FIX could not start the diagnosis.',
                );
            }

            const runId =
                data.runId;

            if (!runId) {
                throw new Error(
                    'FIX did not return a run ID.',
                );
            }

            while (true) {
                const statusResponse =
                    await fetch(
                        `/api/troubleshoot/${runId}`,
                        {
                            cache: 'no-store',
                        },
                    );

                const statusData =
                    (await statusResponse.json()) as RunResponse;

                if (
                    !statusResponse.ok
                ) {
                    throw new Error(
                        statusData.error ??
                            'Unable to check FIX status.',
                    );
                }

                if (
                    statusData.progress
                ) {
                    setProgress(
                        statusData.progress,
                    );
                }

                if (
                    statusData.status ===
                    'SUCCEEDED'
                ) {
                    if (
                        !statusData.result
                    ) {
                        throw new Error(
                            'FIX completed but returned no diagnosis.',
                        );
                    }

                    setResult(
                        statusData.result,
                    );

                    break;
                }

                if (
                    statusData.status ===
                        'FAILED' ||
                    statusData.status ===
                        'ABORTED' ||
                    statusData.status ===
                        'TIMED-OUT'
                ) {
                    throw new Error(
                        'FIX could not complete the diagnosis. Please try again.',
                    );
                }

                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            POLL_INTERVAL,
                        ),
                );
            }
        } catch (submitError) {
            console.error(
                'FIX ERROR:',
                submitError,
            );

            setError(
                submitError instanceof
                    Error
                    ? submitError.message
                    : 'Something went wrong.',
            );
        } finally {
            setIsRunning(false);
        }
    }

    function reset() {
        setProblem('');
        setImageData(null);
        setImageName('');
        setResult(null);
        setError(null);
        setProgress({
            stage: 'starting',
            sources: 0,
        });
    }

    if (isRunning) {
        return (
            <main className="min-h-screen bg-black px-6 py-16 text-white">
                <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
                    <AgentProgress
                        problem={problem}
                        progress={
                            progress
                        }
                    />
                </div>
            </main>
        );
    }

    if (result) {
        return (
            <main className="min-h-screen bg-black px-6 py-10 text-white">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-10 flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-white/30">
                                FIX
                            </p>

                            <h1 className="mt-3 text-3xl font-medium tracking-tight">
                                Here’s what we found.
                            </h1>
                        </div>

                        <button
                            type="button"
                            onClick={
                                reset
                            }
                            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:border-white/25 hover:text-white"
                        >
                            Start over
                        </button>
                    </div>

                    <section className="rounded-3xl border border-white/10 bg-white/3 p-6 sm:p-8">
                        <div className="mb-8">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                Equipment
                            </p>

                            <h2 className="mt-2 text-xl text-white">
                                {formatEquipment(
                                    result.equipment ||
                                        'Unknown equipment',
                                )}
                            </h2>

                            {result.model &&
                                result.model !==
                                    'Unknown' && (
                                    <p className="mt-1 text-sm text-white/40">
                                        {
                                            result.model
                                        }
                                    </p>
                                )}
                        </div>

                        <div className="mb-8 rounded-2xl border border-white/10 bg-white/4 p-5">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                                First thing to try
                            </p>

                            <p className="mt-3 text-lg leading-7 text-white">
                                {
                                    result.firstAction
                                }
                            </p>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                    What may be happening
                                </p>

                                <p className="mt-3 leading-7 text-white/65">
                                    {
                                        result.summary
                                    }
                                </p>
                            </div>

                            {result.steps
                                ?.length >
                                0 && (
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                        What to do
                                    </p>

                                    <ol className="mt-4 space-y-4">
                                        {result.steps.map(
                                            (
                                                step,
                                                index,
                                            ) => (
                                                <li
                                                    key={`${step}-${index}`}
                                                    className="flex gap-4 text-sm leading-6 text-white/65"
                                                >
                                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-white/40">
                                                        {index +
                                                            1}
                                                    </span>

                                                    <span>
                                                        {
                                                            step
                                                        }
                                                    </span>
                                                </li>
                                            ),
                                        )}
                                    </ol>
                                </div>
                            )}

                            {result.likelyIssues
                                ?.length >
                                0 && (
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                        Possible causes
                                    </p>

                                    <ul className="mt-4 space-y-3">
                                        {result.likelyIssues.map(
                                            (
                                                issue,
                                                index,
                                            ) => (
                                                <li
                                                    key={`${issue}-${index}`}
                                                    className="text-sm leading-6 text-white/55"
                                                >
                                                    {issue}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}

                            {result.questions
                                ?.length >
                                0 && (
                                <div>
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                        If that doesn’t work
                                    </p>

                                    <ul className="mt-4 space-y-3">
                                        {result.questions.map(
                                            (
                                                question,
                                                index,
                                            ) => (
                                                <li
                                                    key={`${question}-${index}`}
                                                    className="text-sm leading-6 text-white/55"
                                                >
                                                    {question}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}

                            {result.serviceNeeded && (
                                <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                        Service
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-white/60">
                                        This problem may require professional service. FIX does not recommend opening or repairing hazardous components yourself.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {result.sources?.length >
                        0 && (
                        <section className="mt-8">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/30">
                                Research
                            </p>

                            <div className="mt-4 space-y-2">
                                {result.sources.map(
                                    (
                                        source,
                                        index,
                                    ) => (
                                        <a
                                            key={`${source.url}-${index}`}
                                            href={
                                                source.url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block rounded-2xl border border-white/10 p-4 transition hover:border-white/20"
                                        >
                                            <p className="text-sm text-white/70">
                                                {
                                                    source.title
                                                }
                                            </p>

                                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/30">
                                                {
                                                    source.snippet
                                                }
                                            </p>
                                        </a>
                                    ),
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black px-6 py-12 text-white">
            <div className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center">
                <div className="max-w-3xl">
                    <p className="text-xs uppercase tracking-[0.32em] text-white/30">
                        FIX
                    </p>

                    <h1 className="mt-6 text-5xl font-medium tracking-[-0.04em] sm:text-7xl">
                        Something broken?
                    </h1>

                    <p className="mt-3 text-2xl tracking-[-0.02em] text-white/35 sm:text-4xl">
                        Show us.
                    </p>

                    <p className="mt-8 max-w-xl text-sm leading-7 text-white/40">
                        Tell FIX what’s wrong or show
                        us the equipment. We’ll research
                        the problem and tell you what to
                        try first.
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="mt-14 max-w-3xl"
                >
                    {imageData && (
                        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/3 p-3">
                            <img
                                src={
                                    imageData
                                }
                                alt="Equipment preview"
                                className="h-20 w-20 rounded-xl object-cover"
                            />

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm text-white/70">
                                    {
                                        imageName
                                    }
                                </p>

                                <p className="mt-1 text-xs text-white/30">
                                    Image attached
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    removeImage
                                }
                                className="shrink-0 rounded-full px-3 py-2 text-xs text-white/40 transition hover:bg-white/5 hover:text-white"
                            >
                                Remove
                            </button>
                        </div>
                    )}

                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/3">
                        <textarea
                            value={problem}
                            onChange={(
                                event,
                            ) =>
                                setProblem(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="What’s wrong?"
                            rows={5}
                            disabled={
                                isRunning
                            }
                            className="w-full resize-none bg-transparent px-6 py-6 text-lg leading-7 text-white outline-none placeholder:text-white/20"
                        />

                        <div className="flex items-center justify-between border-t border-white/10 px-4 py-4">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={
                                        cameraInputRef
                                    }
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={
                                        handleImage
                                    }
                                    className="hidden"
                                />

                                <input
                                    ref={
                                        imageInputRef
                                    }
                                    type="file"
                                    accept="image/*"
                                    onChange={
                                        handleImage
                                    }
                                    className="hidden"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        cameraInputRef.current?.click()
                                    }
                                    aria-label="Take a photo"
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-white/20 hover:text-white"
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                    >
                                        <path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3l-1.5-2Z" />
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="3"
                                        />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        imageInputRef.current?.click()
                                    }
                                    aria-label="Choose an image"
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-white/20 hover:text-white"
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                    >
                                        <rect
                                            x="3"
                                            y="3"
                                            width="18"
                                            height="18"
                                            rx="2"
                                        />
                                        <circle
                                            cx="8.5"
                                            cy="8.5"
                                            r="1.5"
                                        />
                                        <path d="m21 15-5-5L5 21" />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    aria-label="Voice input"
                                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/25"
                                >
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                    >
                                        <rect
                                            x="9"
                                            y="3"
                                            width="6"
                                            height="12"
                                            rx="3"
                                        />
                                        <path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" />
                                    </svg>
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    !problem.trim() ||
                                    isRunning
                                }
                                className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-25"
                            >
                                Diagnose
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm leading-6 text-red-300/80">
                            {error}
                        </div>
                    )}

                    <p className="mt-4 text-xs text-white/20">
                        FIX researches technical
                        documentation and troubleshooting
                        sources before recommending a
                        next step.
                    </p>
                </form>
            </div>
        </main>
    );
}