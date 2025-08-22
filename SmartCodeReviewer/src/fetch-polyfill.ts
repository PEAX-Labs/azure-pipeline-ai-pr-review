// Simple fetch polyfill for environments that don't have native fetch
// This will be dynamically imported only when needed

declare const global: any;

export async function polyfillFetch(): Promise<void> {
  if (typeof global.fetch === 'undefined') {
    try {
      // Try to use node-fetch as a polyfill
      const nodeFetch = await import('node-fetch');
      global.fetch = nodeFetch.default;
      global.Headers = nodeFetch.Headers;
      global.Request = nodeFetch.Request;
      global.Response = nodeFetch.Response;
    } catch (error) {
      // If node-fetch is not available, we'll need to handle this gracefully
      console.warn('Fetch polyfill not available. Some features may not work.');
    }
  }
}

export function ensureFetchAvailable(): void {
  if (typeof global.fetch === 'undefined') {
    throw new Error('Fetch is not available in this environment. Please ensure fetch polyfill is loaded.');
  }
}
