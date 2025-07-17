// src/lib/ragCacheService.ts - RAG Pipeline Cache Management
export interface CachedDocument {
  documentId: string;
  filename: string;
  lastLoaded: Date;
  ragSystemId?: string; // ID returned by RAG system
  status: 'loading' | 'loaded' | 'error';
  error?: string;
}

class RAGCacheService {
  private cache = new Map<string, CachedDocument>();
  private loadingPromises = new Map<string, Promise<void>>();
  private readonly CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
  private readonly RAG_BASE_URL = 'http://localhost:8000';

  constructor() {
    // Load cache from localStorage on initialization
    this.loadCacheFromStorage();
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanExpiredEntries(), 5 * 60 * 1000);
  }

  /**
   * Check if document is already loaded in RAG system
   */
  isDocumentLoaded(documentId: string): boolean {
    const cached = this.cache.get(documentId);
    if (!cached) return false;
    
    // Check if cache entry is still valid
    const now = new Date();
    const isExpired = (now.getTime() - cached.lastLoaded.getTime()) > this.CACHE_EXPIRY;
    
    if (isExpired) {
      console.log(`📅 Cache expired for document ${documentId}`);
      this.cache.delete(documentId);
      this.saveCacheToStorage();
      return false;
    }
    
    return cached.status === 'loaded';
  }

  /**
   * Check if document is currently being loaded
   */
  isDocumentLoading(documentId: string): boolean {
    const cached = this.cache.get(documentId);
    return cached?.status === 'loading' || this.loadingPromises.has(documentId);
  }

  /**
   * Get cached document info
   */
  getCachedDocument(documentId: string): CachedDocument | null {
    return this.cache.get(documentId) || null;
  }

  /**
   * Load document into RAG system with caching
   */
  async loadDocument(
    documentId: string, 
    filename: string,
    getFileBlob: () => Promise<Blob>
  ): Promise<void> {
    // Check if already loaded
    if (this.isDocumentLoaded(documentId)) {
      console.log(`✅ Document ${filename} already loaded in RAG system (cached)`);
      return;
    }

    // Check if currently loading
    if (this.isDocumentLoading(documentId)) {
      console.log(`⏳ Document ${filename} is already being loaded, waiting...`);
      const existingPromise = this.loadingPromises.get(documentId);
      if (existingPromise) {
        return existingPromise;
      }
    }

    // Start loading process
    const loadingPromise = this.performDocumentLoad(documentId, filename, getFileBlob);
    this.loadingPromises.set(documentId, loadingPromise);
    
    try {
      await loadingPromise;
    } finally {
      this.loadingPromises.delete(documentId);
    }
  }

  /**
   * Actual loading implementation
   */
  private async performDocumentLoad(
    documentId: string,
    filename: string,
    getFileBlob: () => Promise<Blob>
  ): Promise<void> {
    console.log(`🔄 Loading document ${filename} into RAG system...`);
    
    // Mark as loading
    this.cache.set(documentId, {
      documentId,
      filename,
      lastLoaded: new Date(),
      status: 'loading'
    });
    this.saveCacheToStorage();

    try {
      // Check if RAG system already has this document
      const checkResponse = await fetch(`${this.RAG_BASE_URL}/check-document/${documentId}`);
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.exists) {
          console.log(`✅ Document ${filename} already exists in RAG system`);
          this.markAsLoaded(documentId, filename, checkData.ragId);
          return;
        }
      }

      // Get file blob
      const fileBlob = await getFileBlob();
      console.log(`📁 File blob retrieved, size: ${fileBlob.size} bytes`);

      // Create File object
      const file = new File([fileBlob], filename, { type: 'application/pdf' });

      // Upload to RAG system
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_id', documentId); // Send document ID for tracking

      const ragResponse = await fetch(`${this.RAG_BASE_URL}/upload-pdf`, {
        method: 'POST',
        body: formData
      });

      if (!ragResponse.ok) {
        const ragError = await ragResponse.text();
        throw new Error(`RAG system error: ${ragError}`);
      }

      const ragResult = await ragResponse.json();
      console.log(`✅ Document ${filename} loaded into RAG system:`, ragResult);

      // Mark as successfully loaded
      this.markAsLoaded(documentId, filename, ragResult.id || ragResult.document_id);

    } catch (error) {
      console.error(`❌ Failed to load document ${filename}:`, error);
      
      // Mark as error
      this.cache.set(documentId, {
        documentId,
        filename,
        lastLoaded: new Date(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.saveCacheToStorage();
      
      throw error;
    }
  }

  /**
   * Mark document as successfully loaded (now public)
   */
  markAsLoaded(documentId: string, filename: string, ragSystemId?: string): void {
    this.cache.set(documentId, {
      documentId,
      filename,
      lastLoaded: new Date(),
      status: 'loaded',
      ragSystemId
    });
    this.saveCacheToStorage();
    console.log(`✅ Marked document ${filename} as loaded in cache`);
  }

  /**
   * Mark document as loading (public method)
   */
  markAsLoading(documentId: string, filename: string): void {
    this.cache.set(documentId, {
      documentId,
      filename,
      lastLoaded: new Date(),
      status: 'loading'
    });
    this.saveCacheToStorage();
    console.log(`⏳ Marked document ${filename} as loading in cache`);
  }

  /**
   * Mark document as error (public method)
   */
  markAsError(documentId: string, filename: string, error: string): void {
    this.cache.set(documentId, {
      documentId,
      filename,
      lastLoaded: new Date(),
      status: 'error',
      error
    });
    this.saveCacheToStorage();
    console.log(`❌ Marked document ${filename} as error in cache: ${error}`);
  }

  /**
   * Clear cache for specific document
   */
  clearDocument(documentId: string): void {
    this.cache.delete(documentId);
    this.loadingPromises.delete(documentId);
    this.saveCacheToStorage();
    console.log(`🗑️ Cleared cache for document ${documentId}`);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    this.loadingPromises.clear();
    this.saveCacheToStorage();
    console.log(`🗑️ Cleared all RAG cache`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalDocuments: number;
    loadedDocuments: number;
    loadingDocuments: number;
    errorDocuments: number;
    cacheSize: string;
  } {
    const total = this.cache.size;
    let loaded = 0, loading = 0, error = 0;
    
    for (const doc of this.cache.values()) {
      switch (doc.status) {
        case 'loaded': loaded++; break;
        case 'loading': loading++; break;
        case 'error': error++; break;
      }
    }

    return {
      totalDocuments: total,
      loadedDocuments: loaded,
      loadingDocuments: loading,
      errorDocuments: error,
      cacheSize: this.formatCacheSize()
    };
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredEntries(): void {
    const now = new Date();
    let cleanedCount = 0;
    
    for (const [documentId, cached] of this.cache.entries()) {
      const isExpired = (now.getTime() - cached.lastLoaded.getTime()) > this.CACHE_EXPIRY;
      if (isExpired) {
        this.cache.delete(documentId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
      this.saveCacheToStorage();
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries()).map(([id, doc]) => [
        id,
        {
          ...doc,
          lastLoaded: doc.lastLoaded.toISOString()
        }
      ]);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('rag_cache', JSON.stringify(cacheData));
      }
    } catch (error) {
      console.warn('Failed to save RAG cache to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cacheData = window.localStorage.getItem('rag_cache');
        if (cacheData) {
          const parsed = JSON.parse(cacheData);
          for (const [id, doc] of parsed) {
            this.cache.set(id, {
              ...doc,
              lastLoaded: new Date(doc.lastLoaded)
            });
          }
          console.log(`📦 Loaded ${this.cache.size} documents from cache`);
        }
      }
    } catch (error) {
      console.warn('Failed to load RAG cache from localStorage:', error);
      this.cache.clear();
    }
  }

  /**
   * Format cache size for display
   */
  private formatCacheSize(): string {
    const cacheString = JSON.stringify(Array.from(this.cache.entries()));
    const sizeInBytes = new Blob([cacheString]).size;
    const sizeInKB = Math.round(sizeInBytes / 1024);
    return `${sizeInKB} KB`;
  }

  /**
   * Reset document status (for retrying after errors)
   */
  resetDocumentStatus(documentId: string): void {
    this.cache.delete(documentId);
    this.loadingPromises.delete(documentId);
    this.saveCacheToStorage();
  }
}

// Export singleton instance
export const ragCacheService = new RAGCacheService();

// Export hook for React components
export const useRAGCache = () => {
  return {
    isLoaded: (documentId: string) => ragCacheService.isDocumentLoaded(documentId),
    isLoading: (documentId: string) => ragCacheService.isDocumentLoading(documentId),
    getCached: (documentId: string) => ragCacheService.getCachedDocument(documentId),
    loadDocument: (documentId: string, filename: string, getFileBlob: () => Promise<Blob>) => 
      ragCacheService.loadDocument(documentId, filename, getFileBlob),
    markAsLoaded: (documentId: string, filename: string, ragSystemId?: string) =>
      ragCacheService.markAsLoaded(documentId, filename, ragSystemId),
    markAsLoading: (documentId: string, filename: string) =>
      ragCacheService.markAsLoading(documentId, filename),
    markAsError: (documentId: string, filename: string, error: string) =>
      ragCacheService.markAsError(documentId, filename, error),
    clearDocument: (documentId: string) => ragCacheService.clearDocument(documentId),
    clearAll: () => ragCacheService.clearAll(),
    getStats: () => ragCacheService.getCacheStats(),
    resetStatus: (documentId: string) => ragCacheService.resetDocumentStatus(documentId)
  };
};