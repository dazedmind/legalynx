// src/lib/ragCacheService.ts - RAG Pipeline Cache Management
import { authUtils } from '@/lib/auth';
const isDevelopment = process.env.NODE_ENV === 'development';

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
  private readonly RAG_BASE_URL = isDevelopment ? 'http://localhost:8000' : process.env.NEXT_PUBLIC_RAG_API_URL;

  constructor() {
    // Load cache from localStorage on initialization
    this.loadCacheFromStorage();
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanExpiredEntries(), 5 * 60 * 1000);
  }

  private getOrCreateRagSessionId(): string {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return 'default';
      }
      let sessionId = localStorage.getItem('rag_session_id');
      if (!sessionId) {
        sessionId = `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
        localStorage.setItem('rag_session_id', sessionId);
      }
      return sessionId;
    } catch {
      return 'default';
    }
  }

  private getRagHeaders(includeJson: boolean = false): HeadersInit {
    const headers: HeadersInit = {};
    const token = authUtils.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    headers['X-Session-Id'] = this.getOrCreateRagSessionId();
    if (includeJson) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  }

  // 🔥 SIMPLIFIED: No more RAG ID mapping needed - everything uses database cuid IDs

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
   * Fast reactivation for session loading - skips file renaming
   */
  async reactivateDocument(documentId: string, filename: string): Promise<void> {
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

    // Start fast reactivation process
    const reactivatePromise = this.performFastReactivation(documentId, filename);
    this.loadingPromises.set(documentId, reactivatePromise);
    
    try {
      await reactivatePromise;
    } finally {
      this.loadingPromises.delete(documentId);
    }
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
   * Fast reactivation implementation - calls backend's reactivate endpoint
   */
  private async performFastReactivation(
    documentId: string,
    filename: string
  ): Promise<void> {
    console.log(`⚡ Fast reactivation: ${filename}...`);
    
    // Mark as loading
    this.cache.set(documentId, {
      documentId,
      filename,
      lastLoaded: new Date(),
      status: 'loading'
    });
    this.saveCacheToStorage();

    try {
      // Check if RAG system is available
      const isAvailable = await this.checkRAGSystemAvailability();
      if (!isAvailable) {
        throw new Error('RAG system is not available. Please ensure the FastAPI backend is running.');
      }

      console.log(`🔄 Calling reactivate-document endpoint for ${documentId}...`);
      const reactivateResponse = await fetch(`${this.RAG_BASE_URL}/reactivate-document/${documentId}`, {
        method: 'POST',
        headers: this.getRagHeaders(true)
      });

      if (!reactivateResponse.ok) {
        let errorMessage = 'Unknown error';
        try {
          const errorData = await reactivateResponse.json();
          errorMessage = errorData.detail || errorData.error || `HTTP ${reactivateResponse.status}`;
        } catch {
          errorMessage = `HTTP ${reactivateResponse.status}: ${reactivateResponse.statusText}`;
        }
        
        console.error(`❌ Fast reactivation failed:`, errorMessage);
        throw new Error(`Fast reactivation error: ${errorMessage}`);
      }

      const result = await reactivateResponse.json();
      console.log(`✅ Fast reactivation result:`, result);
      console.log(`⚡ Processing time: ${result.processing_time}s`);
      console.log(`📊 Status: ${result.status}`);

      // Mark as successfully loaded
      this.markAsLoaded(documentId, filename, documentId);

    } catch (error) {
      console.error(`❌ Failed to reactivate document ${filename}:`, error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'RAG system is not available. Please ensure the backend service is running.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Authentication failed. Please sign in again.';
        } else if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = 'Document not found in database. Please re-upload the document.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Mark as error
      this.cache.set(documentId, {
        documentId,
        filename,
        lastLoaded: new Date(),
        status: 'error',
        error: errorMessage
      });
      this.saveCacheToStorage();
      
      throw error;
    }
  }

  /**
   * Check if RAG system is available
   */
  private async checkRAGSystemAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.RAG_BASE_URL}/health`, {
        method: 'GET',
        headers: this.getRagHeaders(),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('RAG system not available:', error);
      return false;
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
      // Check if RAG system is available
      const isAvailable = await this.checkRAGSystemAvailability();
      if (!isAvailable) {
        throw new Error('RAG system is not available. Please ensure the FastAPI backend is running on http://localhost:8000');
      }

      // 🔥 SIMPLIFIED: Use database cuid ID directly for RAG system calls
      console.log(`🔍 Checking if document ${documentId} already exists in RAG system...`);
      const checkResponse = await fetch(`${this.RAG_BASE_URL}/check-document/${documentId}`, {
        headers: this.getRagHeaders()
      });
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        if (checkData.exists) {
          console.log(`✅ Document ${filename} already exists in RAG system`);
          this.markAsLoaded(documentId, filename, documentId);
          // Activate this document for current session/user without re-upload
          try {
            const activateResponse = await fetch(`${this.RAG_BASE_URL}/activate-document/${documentId}`, {
              method: 'POST',
              headers: this.getRagHeaders(true)
            });
            
            if (activateResponse.ok) {
              const activateResult = await activateResponse.json();
              console.log(`✅ Document activation result:`, activateResult);
              
              if (activateResult.status === 'activated_existing') {
                console.log(`✅ Activated existing document ${documentId} for current session`);
                return; // Successfully activated existing document
              } else if (activateResult.status === 're_uploaded_and_activated') {
                console.log(`✅ Document ${documentId} was re-uploaded and activated (processing time: ${activateResult.processing_time}s)`);
                // Mark as loaded since it was successfully re-uploaded
                this.markAsLoaded(documentId, filename, documentId);
                return; // Successfully re-uploaded and activated
              } else {
                console.log(`✅ Document ${documentId} activated with status: ${activateResult.status}`);
                return; // Successfully activated with unknown status
              }
            } else {
              const errorText = await activateResponse.text();
              console.warn(`⚠️ Failed to activate document (${activateResponse.status}):`, errorText);
              // Continue with upload as fallback
              console.log('🔄 Continuing with document upload due to activation failure');
              this.clearDocument(documentId);
            }
          } catch (e) {
            console.warn('⚠️ Failed to activate existing document for session:', e);
            // If activation fails, continue with upload to ensure document is available
            console.log('🔄 Continuing with document upload due to activation failure');
            // Clear the cache entry since it's outdated
            this.clearDocument(documentId);
          }
          // If we reach here, activation failed, so continue with upload
        }
      } else {
        console.log(`⚠️ Document check failed (${checkResponse.status}), proceeding with upload`);
        // If document check fails, clear any stale cache entry
        if (checkResponse.status === 404) {
          console.log('🧹 Clearing stale cache entry due to 404');
          this.clearDocument(documentId);
        }
      }

      // Get file blob
      console.log(`📁 Retrieving file blob for ${filename}...`);
      const fileBlob = await getFileBlob();
      console.log(`📁 File blob retrieved, size: ${fileBlob.size} bytes`);

      if (fileBlob.size === 0) {
        throw new Error('File blob is empty - document may have been deleted or corrupted');
      }

      // Create File object
      const file = new File([fileBlob], filename, { type: 'application/pdf' });

      // Upload to RAG system (fallback only when not found)
      console.log(`📤 Uploading ${filename} to RAG system...`);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_id', documentId); // Send document ID for tracking

      const ragResponse = await fetch(`${this.RAG_BASE_URL}/upload-pdf`, {
        method: 'POST',
        headers: this.getRagHeaders(),
        body: formData
      });

      if (!ragResponse.ok) {
        let ragError = 'Unknown error';
        try {
          const errorText = await ragResponse.text();
          ragError = errorText;
        } catch (parseError) {
          ragError = `HTTP ${ragResponse.status}: ${ragResponse.statusText}`;
        }
        
        console.error(`❌ RAG system upload failed:`, {
          status: ragResponse.status,
          statusText: ragResponse.statusText,
          error: ragError
        });
        
        throw new Error(`RAG system error: ${ragError}`);
      }

      const ragResult = await ragResponse.json();
      console.log(`✅ Document ${filename} loaded into RAG system:`, ragResult);

      // Mark as successfully loaded
      this.markAsLoaded(documentId, filename, ragResult.id || ragResult.document_id);

      // Ensure activation after upload
      try {
        const activateResponse = await fetch(`${this.RAG_BASE_URL}/activate-document/${documentId}`, {
          method: 'POST',
          headers: this.getRagHeaders(true)
        });
        
        if (activateResponse.ok) {
          const activateResult = await activateResponse.json();
          console.log(`✅ Post-upload activation result:`, activateResult);
          
          if (activateResult.status === 'activated_existing') {
            console.log(`✅ Activated uploaded document ${documentId} for current session`);
          } else if (activateResult.status === 're_uploaded_and_activated') {
            console.log(`⚠️ Document was re-uploaded during activation - this shouldn't happen after upload`);
          }
        } else {
          const errorText = await activateResponse.text();
          console.warn(`⚠️ Failed to activate uploaded document (${activateResponse.status}):`, errorText);
          // Don't throw error - document is uploaded, activation is just optimization
        }
      } catch (e) {
        console.warn('⚠️ Failed to activate uploaded document for session:', e);
        // Don't throw error - document is uploaded, activation is just optimization
      }

    } catch (error) {
      console.error(`❌ Failed to load document ${filename}:`, error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'RAG system is not available. Please ensure the backend service is running.';
        } else if (error.message.includes('Not Found')) {
          errorMessage = 'RAG system endpoint not found. Please check the backend configuration.';
        } else if (error.message.includes('empty')) {
          errorMessage = 'Document file is empty or corrupted. Please re-upload the document.';
        } else if (error.message.includes('not available')) {
          errorMessage = error.message; // Use the specific message from availability check
        } else {
          errorMessage = error.message;
        }
      }
      
      // Mark as error
      this.cache.set(documentId, {
        documentId,
        filename,
        lastLoaded: new Date(),
        status: 'error',
        error: errorMessage
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
   * Clear all cache and force fresh start - useful during ID system transitions
   */
  clearAllAndReset(): void {
    console.log('🔄 Clearing all RAG cache and resetting for ID system transition');
    this.cache.clear();
    this.loadingPromises.clear();
    this.saveCacheToStorage();
    
    // Also clear the RAG session to start fresh
    if (typeof window !== 'undefined') {
      const oldSessionId = localStorage.getItem('rag_session_id');
      if (oldSessionId) {
        console.log(`🔄 Clearing old RAG session: ${oldSessionId}`);
        localStorage.removeItem('rag_session_id');
      }
    }
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
    reactivateDocument: (documentId: string, filename: string) =>
      ragCacheService.reactivateDocument(documentId, filename),
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