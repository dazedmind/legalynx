export interface UploadResponse {
  documentId: string;
  filename: string;          // RAG system uses 'filename' 
  originalName: string;      // But we also need 'originalName'
  size: number;
  uploadedAt: string;
  pages_processed: number;
  mimeType: string;
  conversionPerformed: boolean;
  status?: string;
  securityStatus?: string;
  
  // Additional fields for compatibility with ChatViewer
  fileName?: string;         // Alternative field name
  originalFileName?: string; // Alternative field name  
  fileSize?: number;         // Alternative field name
  pageCount?: number;        // Alternative field name
}
  export interface QueryResponse {
    answer: string;
    sources: Array<{
      id: string;
      text: string;
      metadata: {
        pageNumber: number;
        section?: string;
      };
    }>;
    confidence: number;
    processingTime: number;
  }