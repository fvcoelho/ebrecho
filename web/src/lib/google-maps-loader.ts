/**
 * Centralized Google Maps API loader
 * Ensures the Google Maps script is only loaded once
 */

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
    googleMapsLoaded?: boolean;
    googleMapsCallbacks?: Array<() => void>;
  }
}

let isLoading = false;
let isLoaded = false;
const callbacks: Array<(error?: Error) => void> = [];

/**
 * Load Google Maps JavaScript API
 * This function ensures the script is only loaded once, even if called multiple times
 */
export const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (isLoaded && window.google?.maps) {
      console.log('✅ Google Maps already loaded');
      resolve();
      return;
    }

    // If currently loading, add to callbacks
    if (isLoading) {
      console.log('⏳ Google Maps is already loading, adding to queue');
      callbacks.push((error) => {
        if (error) reject(error);
        else resolve();
      });
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('📍 Google Maps script found in DOM');
      
      // If google object exists, mark as loaded
      if (window.google?.maps) {
        isLoaded = true;
        resolve();
        return;
      }

      // Otherwise wait for it to load
      existingScript.addEventListener('load', () => {
        isLoaded = true;
        resolve();
        callbacks.forEach(cb => cb());
        callbacks.length = 0;
      });

      existingScript.addEventListener('error', () => {
        const error = new Error('Failed to load Google Maps API');
        reject(error);
        callbacks.forEach(cb => cb(error));
        callbacks.length = 0;
      });
      return;
    }

    // Start loading
    isLoading = true;
    console.log('🚀 Starting to load Google Maps API');

    // Create callback function name
    const callbackName = 'initGoogleMaps';
    
    // Define the callback
    window[callbackName] = () => {
      console.log('✅ Google Maps API loaded successfully');
      isLoaded = true;
      isLoading = false;
      window.googleMapsLoaded = true;
      
      // Resolve promise and all queued callbacks
      resolve();
      callbacks.forEach(cb => cb());
      callbacks.length = 0;
    };

    // Create and append script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=pt-BR&region=BR&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';

    script.onerror = () => {
      console.error('❌ Failed to load Google Maps API');
      isLoading = false;
      const error = new Error('Failed to load Google Maps API');
      
      // Reject promise and all queued callbacks
      reject(error);
      callbacks.forEach(cb => cb(error));
      callbacks.length = 0;
    };

    document.head.appendChild(script);
  });
};

/**
 * Check if Google Maps is loaded
 */
export const isGoogleMapsLoaded = (): boolean => {
  return isLoaded && !!window.google?.maps;
};

/**
 * Wait for Google Maps to be ready
 */
export const waitForGoogleMaps = async (timeout = 10000): Promise<void> => {
  const startTime = Date.now();
  
  while (!isGoogleMapsLoaded()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for Google Maps to load');
    }
    
    // If not loading, start loading
    if (!isLoading) {
      return loadGoogleMapsAPI();
    }
    
    // Otherwise wait a bit
    await new Promise(resolve => setTimeout(resolve, 100));
  }
};

/**
 * Unload Google Maps (for cleanup)
 */
export const unloadGoogleMaps = (): void => {
  const script = document.getElementById('google-maps-script');
  if (script) {
    script.remove();
  }
  
  isLoaded = false;
  isLoading = false;
  delete window.google;
  delete window.initGoogleMaps;
  delete window.googleMapsLoaded;
};