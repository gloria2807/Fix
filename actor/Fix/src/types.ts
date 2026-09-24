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
    imageUrl?: string;
}

export interface ResearchSource {
    title: string;
    url: string;
    snippet: string;
    sourceType: 'manual' | 'manufacturer' | 'repair' | 'product' | 'local';
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