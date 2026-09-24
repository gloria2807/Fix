'use client';

import { useState } from 'react';
import {
    ArrowUp,
    Camera,
    Image as ImageIcon,
    Mic,
} from 'lucide-react';

export default function Home() {
    const [problem, setProblem] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    async function submit() {
        if (!problem.trim()) return;

        setLoading(true);

        try {
            const response = await fetch('/api/troubleshoot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    problem,
                    equipment: 'unknown',
                    location: 'Lagos, Nigeria',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setResult(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (result) {
        return (
            <main className="min-h-screen bg-[#0b0b0b] text-white">
                <div className="mx-auto max-w-4xl px-6 py-12">
                    <button
                        onClick={() => setResult(null)}
                        className="mb-16 text-sm text-white/50 hover:text-white"
                    >
                        ← New problem
                    </button>

                    <p className="mb-4 text-sm uppercase tracking-[0.25em] text-white/40">
                        FIX
                    </p>

                    <h1 className="text-5xl font-medium tracking-tight">
                        {result.equipment}
                    </h1>

                    <p className="mt-6 max-w-2xl text-xl leading-8 text-white/60">
                        {result.summary}
                    </p>

                    <section className="mt-14 rounded-3xl border border-white/10 bg-white/4 p-8">
                        <p className="text-sm uppercase tracking-[0.2em] text-white/40">
                            Try this first
                        </p>

                        <h2 className="mt-4 text-2xl font-medium">
                            {result.firstAction}
                        </h2>
                    </section>

                    <section className="mt-8">
                        <h2 className="text-xl font-medium">
                            Troubleshooting
                        </h2>

                        <div className="mt-5 space-y-3">
                            {result.steps?.map(
                                (step: string, index: number) => (
                                    <div
                                        key={index}
                                        className="flex gap-4 rounded-2xl border border-white/10 p-5"
                                    >
                                        <span className="text-white/30">
                                            {String(index + 1).padStart(
                                                2,
                                                '0',
                                            )}
                                        </span>

                                        <p className="text-white/70">
                                            {step}
                                        </p>
                                    </div>
                                ),
                            )}
                        </div>
                    </section>

                    {result.questions?.length > 0 && (
                        <section className="mt-12">
                            <h2 className="text-xl font-medium">
                                I need to know one more thing
                            </h2>

                            <p className="mt-4 text-lg text-white/60">
                                {result.questions[0]}
                            </p>
                        </section>
                    )}
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#0b0b0b] text-white">
            <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
                <nav className="flex items-center justify-between py-8">
                    <div className="text-xl font-semibold tracking-tight">
                        FIX
                    </div>

                    <div className="text-sm text-white/40">
                        Equipment troubleshooting
                    </div>
                </nav>

                <div className="flex flex-1 flex-col items-center justify-center pb-20">
                    <p className="mb-6 text-sm uppercase tracking-[0.3em] text-white/35">
                        Something broken?
                    </p>

                    <h1 className="max-w-3xl text-center text-6xl font-medium tracking-[-0.04em] md:text-8xl">
                        Show us.
                    </h1>

                    <p className="mt-7 max-w-xl text-center text-lg leading-8 text-white/45">
                        Tell FIX what's wrong. We'll identify the problem,
                        research it and show you what to try next.
                    </p>

                    <div className="mt-12 w-full max-w-2xl rounded-4xl border border-white/10 bg-white/4 p-3 shadow-2xl">
                        <textarea
                            value={problem}
                            onChange={(event) =>
                                setProblem(event.target.value)
                            }
                            placeholder="My generator starts but shuts down after 30 seconds..."
                            className="min-h-36 w-full resize-none bg-transparent p-5 text-lg outline-none placeholder:text-white/20"
                        />

                        <div className="flex items-center justify-between border-t border-white/10 px-3 pt-3">
                            <div className="flex gap-2">
                                <button className="rounded-full p-3 text-white/40 hover:bg-white/10 hover:text-white">
                                    <Camera size={20} />
                                </button>

                                <button className="rounded-full p-3 text-white/40 hover:bg-white/10 hover:text-white">
                                    <ImageIcon size={20} />
                                </button>

                                <button className="rounded-full p-3 text-white/40 hover:bg-white/10 hover:text-white">
                                    <Mic size={20} />
                                </button>
                            </div>

                            <button
                                onClick={submit}
                                disabled={loading || !problem.trim()}
                                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black disabled:opacity-20"
                            >
                                <ArrowUp size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 text-xs text-white/25">
                        Generators · Printers · Freezers · Inverters
                    </div>
                </div>
            </div>
        </main>
    );
}