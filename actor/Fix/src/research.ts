import { ApifyClient } from 'apify-client';
import type { ResearchSource } from './types.js';

interface OrganicResult {
    title?: string;
    url?: string;
    description?: string;
    position?: number;
}

interface SearchPage {
    organicResults?: OrganicResult[];
}

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN,
});

export async function researchWeb(
    queries: string[],
): Promise<ResearchSource[]> {
    const searchQueries = queries
        .map((query) => query.trim())
        .filter(Boolean)
        .join('\n');

    if (!searchQueries) {
        return [];
    }

    const run = await client
        .actor('apify/google-search-scraper')
        .call({
            queries: searchQueries,
            maxPagesPerQuery: 1,

            countryCode: 'ng',
            searchLanguages: 'en',
            languageCode: 'en',

            mobileResults: false,
            includeUnfilteredResults: false,

            aiOverview: {
                scrapeFullAiOverview: false,
            },

            aiModeSearch: {
                enableAiMode: false,
            },

            geminiSearch: {
                enableGemini: false,
            },

            perplexitySearch: {
                enablePerplexity: false,
                returnImages: false,
                returnRelatedQuestions: false,
            },

            chatGptSearch: {
                enableChatGpt: false,
            },

            copilotSearch: {
                enableCopilot: false,
            },

            maximumLeadsEnrichmentRecords: 0,

            websiteContentScraper: {
                enable: false,
            },

            saveHtml: false,
            saveHtmlToKeyValueStore: false,
        });

    const { items } = await client
        .dataset(run.defaultDatasetId)
        .listItems();

    const sources: ResearchSource[] = [];

    for (const item of items as SearchPage[]) {
        for (const result of item.organicResults ?? []) {
            if (!result.title || !result.url) {
                continue;
            }

            const text = `${result.title} ${result.description ?? ''}`.toLowerCase();

            let sourceType: ResearchSource['sourceType'] = 'repair';

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
                title: result.title,
                url: result.url,
                snippet: result.description ?? '',
                sourceType,
            });
        }
    }

    // Remove duplicate URLs.
    const unique = Array.from(
        new Map(
            sources.map((source) => [source.url, source]),
        ).values(),
    );

    return unique.slice(0, 8);
}