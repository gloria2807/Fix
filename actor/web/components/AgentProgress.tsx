type AgentProgressProps = {
    problem: string;
    progress: {
        stage: string;
        sources: number;
    };
};

const stages = [
    {
        id: 'identifying',
        label: 'Identified equipment',
    },
    {
        id: 'researching',
        label: 'Researched initial symptoms',
    },
    {
        id: 'documentation',
        label: 'Checked technical documentation',
    },
    {
        id: 'evaluating',
        label: 'Evaluated sources',
    },
    {
        id: 'sufficient',
        label: 'Determined sufficient evidence',
    },
    {
        id: 'action',
        label: 'Selected safest first action',
    },
];

const stageOrder = [
    'starting',
    'identifying',
    'researching',
    'documentation',
    'evaluating',
    'sufficient',
    'action',
    'complete',
];

export default function AgentProgress({
    problem,
    progress,
}: AgentProgressProps) {
    const currentIndex =
        stageOrder.indexOf(
            progress.stage,
        );

    return (
        <div className="w-full max-w-xl">
            <div className="mb-10">
                <p className="text-xs uppercase tracking-[0.28em] text-white/30">
                    FIX AGENT
                </p>

                <p className="mt-5 text-sm text-white/35">
                    Goal
                </p>

                <p className="mt-1 text-lg leading-7 text-white/80">
                    Diagnose: “{problem}”
                </p>
            </div>

            <div className="space-y-5">
                {stages.map(
                    (stage) => {
                        const stageIndex =
                            stageOrder.indexOf(
                                stage.id,
                            );

                        const completed =
                            currentIndex >
                            stageIndex;

                        const active =
                            progress.stage ===
                            stage.id;

                        return (
                            <div
                                key={stage.id}
                                className="flex items-center gap-4"
                            >
                                <div
                                    className={[
                                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] transition-all duration-300',
                                        completed
                                            ? 'border-white bg-white text-black'
                                            : active
                                              ? 'border-white/50 text-white'
                                              : 'border-white/10 text-transparent',
                                    ].join(
                                        ' ',
                                    )}
                                >
                                    {completed
                                        ? '✓'
                                        : active
                                          ? '•'
                                          : ''}
                                </div>

                                <span
                                    className={[
                                        'text-sm transition-colors duration-300',
                                        completed
                                            ? 'text-white/65'
                                            : active
                                              ? 'text-white'
                                              : 'text-white/25',
                                    ].join(
                                        ' ',
                                    )}
                                >
                                    {
                                        stage.label
                                    }

                                    {stage.id ===
                                        'evaluating' &&
                                        progress.sources >
                                            0 && (
                                            <span className="ml-1 text-white/35">
                                                ·{' '}
                                                {
                                                    progress.sources
                                                }{' '}
                                                sources
                                            </span>
                                        )}

                                    {stage.id ===
                                        'documentation' &&
                                        progress.sources >
                                            0 && (
                                            <span className="ml-1 text-white/35">
                                                ·{' '}
                                                {
                                                    progress.sources
                                                }{' '}
                                                found
                                            </span>
                                        )}
                                </span>
                            </div>
                        );
                    },
                )}
            </div>
        </div>
    );
}