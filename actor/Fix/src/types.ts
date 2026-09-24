export type EquipmentType =
    | 'generator'
    | 'inverter'
    | 'thermal_printer'
    | 'freezer'
    | 'refrigerator'
    | 'unknown';

export interface FixInput {
    problem: string;
    equipment?: EquipmentType;
    model?: string;
    location?: string;

    /*
     * Optional image captured or selected by
     * the user in the browser.
     *
     * The image is kept temporarily in the
     * current browser session and sent to FIX
     * as a compressed data URL.
     */
    imageData?: string;
}

export interface ResearchSource {
    title: string;
    url: string;
    snippet: string;
    sourceType:
        | 'manual'
        | 'manufacturer'
        | 'repair'
        | 'product'
        | 'local';
}

export interface VisualAnalysis {
    equipment: string;
    model: string;
    confidence: number;
    visibleSymptoms: string[];
    visualClues: string[];
}

export interface Diagnosis {
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
    sources: ResearchSource[];
}