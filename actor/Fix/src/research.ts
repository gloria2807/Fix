import { ApifyClient } from 'apify-client';

import type {
    ResearchSource,
} from './types.js';

interface SearchResult {
    type?: string;
    title?: string;
    link?: string;
    snippet?: string;
    visible_link?: string;
}

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

const RESEARCH_ACTOR =
    'apidojo/google-search-scraper';

export async function researchWeb(
    queries: string[],
): Promise<ResearchSource[]> {
    const searchTerms = queries
        .map((query) => query.trim())
        .filter(Boolean)
        .slice(0, 2);

    if (searchTerms.length === 0) {
        return [];
    }

    const run = await client
        .actor(RESEARCH_ACTOR)
        .call({
            searchTerms,
            countryCode: 'ng',
            languageCode: 'en',
            maxItems: 10,
            maxPagesPerQuery: 1,
            mobileResults: false,
        });

    if (!run.defaultDatasetId) {
        return [];
    }

    const { items } = await client
        .dataset(run.defaultDatasetId)
        .listItems();

    const sources: ResearchSource[] = [];

    for (const item of items as SearchResult[]) {
        if (!item.title || !item.link) {
            continue;
        }

        const text = (
            `${item.title} ${
                item.snippet ?? ''
            }`
        ).toLowerCase();

        let sourceType: ResearchSource['sourceType'] =
            'repair';

        if (
            text.includes('manual') ||
            text.includes('user guide') ||
            text.includes('owner guide')
        ) {
            sourceType = 'manual';
        } else if (
            text.includes('manufacturer') ||
            text.includes('support') ||
            text.includes('official')
        ) {
            sourceType = 'manufacturer';
        } else if (
            text.includes('parts') ||
            text.includes('replacement')
        ) {
            sourceType = 'product';
        }

        sources.push({
            title: item.title,
            url: item.link,
            snippet:
                item.snippet ?? '',
            sourceType,
        });
    }

    const unique = Array.from(
        new Map(
            sources.map(
                (source) => [
                    source.url,
                    source,
                ],
            ),
        ).values(),
    );

    return unique.slice(0, 8);
}