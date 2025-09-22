import { z } from 'zod';
import { EventSchema, Event } from '../schemas/eventModels.js';
import { fetchJson, markreq } from '../shared/core.js';
import { EVENTS_ENDPOINT, PERFORMERS_ENDPOINT, searchPerformers } from '../shared/endpoints.js';
import { CondensedEvent, condenseEventData } from '../shared/helpers.js';
import { PRODUCTS_ENDPOINT } from '../shared/api.js';

function buildQuery(params: any, performerSlug?: string): Record<string, any> {
  const query: Record<string, any> = {
    per_page: Math.min(params.per_page, 50),
    page: params.page,
  };

  // Drop null/undefined values to avoid noisy query strings
  const filteredQuery: Record<string, any> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') {
      filteredQuery[key] = value;
    }
  }

  return filteredQuery;
}


/**
 * Find events based on search criteria.
 * 
 * If the user's query involves a performer, first use GET /performers with the q parameter.
 * Then use the performer slug from the response to make a GET /events call.
 * 
 * If it does not involve a performer, simply use the q parameter on GET /events.
 * 
 * Returns a list of events matching the search criteria, including event details, venue information, and performer details.
 */
export const findProductsTool = {
  name: 'find_products',
  description: 'Search for products by name, category, or description. This tool is optimized for listing and searching products. Returns structured product data.',
  inputSchema: {
    q: z.string().optional().describe('Free-text search term. Use only when no other specific filters match the user request. Keep this text to pronouns if present in the user\'s query unless there are no pronouns in the query. Never duplicate information already captured in other parameters.'),
    category: z.string().optional().describe('Category name or ID to filter products by.'),
    short_description: z.string().optional().describe('Description text to search for in product names or descriptions.'),
    price: z.number().optional().describe('Price greater than or equal to this value.'),
    per_page: z.number().min(1).max(50).default(10).describe('Number of results to return per page (1-50). Default is 10.'),
    page: z.number().min(1).default(1).describe('Page number for pagination. Default is 1.'),
  },
  handler: async (args: any, extra: any) => {
    const params = z.object(findProductsTool.inputSchema).parse(args);
    
    try {
      // Update all code to use the latest API endpoints and formats
      const query = buildQuery(params);

      // First try to find products with the query
      const products = await markreq(`${PRODUCTS_ENDPOINT}?${new URLSearchParams(query).toString()}`, query);

      const responsePayload = {
        status_code: 200,
        message: 'Product Data Fetched Successfully.',
        data: {
          results: products?.data?.results || [],
        },
      };

      // ✅ Always return proper JSON string
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(responsePayload, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('Error in find_events handler:', error);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                status_code: 500,
                error: 'Failed to fetch products',
                details: error,
                suggestion:
                  'Please check your parameters and try again. Common issues include invalid search terms or category filters.',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  },
};
