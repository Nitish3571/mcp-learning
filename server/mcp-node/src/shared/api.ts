import { fetchJson, markreq } from './core.js';

// Base API and endpoints
const BASE_API = "https://api.ecolvegroup.in/api/v1";
export const PRODUCTS_ENDPOINT = `${BASE_API}/products`;

// Helper functions for common API calls
export async function searchPerformers(query: string, per_page: number = 10, page: number = 1) {
  try {
    const performerQuery = {
      q: query,
      per_page: per_page,
      page: page
    };
    
    const performerData = await fetchJson(PRODUCTS_ENDPOINT, performerQuery);
    return performerData.performers || [];
  } catch (error) {
    console.warn('Failed to lookup performer:', error);
    return [];
  }
}

export async function searchEvents(query: string, per_page: number = 10, additionalParams: Record<string, any> = {}) {
  try {
    const eventQuery = {
      q: query,
      per_page: per_page,
      ...additionalParams
    };
    
    // Drop null/undefined values to avoid noisy query strings
    const filteredQuery: Record<string, any> = {};
    for (const [key, value] of Object.entries(eventQuery)) {
      if (value !== null && value !== undefined && value !== '') {
        filteredQuery[key] = value;
      }
    }
    
    const eventData = await markreq(PRODUCTS_ENDPOINT, filteredQuery);
    console.log("eventData************", eventData);
    
    return eventData.data.results || [];
  } catch (error) {
    console.warn('Failed to lookup event:', error);
    return [];
  }
}
