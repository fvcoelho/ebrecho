// Global product refresh system
class ProductRefreshManager {
  private listeners: Set<() => void> = new Set();

  // Subscribe to refresh events
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Trigger refresh for all listeners
  refresh() {
    console.log('🔄 ProductRefreshManager: Triggering refresh for', this.listeners.size, 'listeners');
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('🔄 Error in product refresh callback:', error);
      }
    });
  }
}

// Export singleton instance
export const productRefreshManager = new ProductRefreshManager();