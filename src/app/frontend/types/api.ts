export interface UploadResponse {
    documentId: string;
    filename: string;
    originalName: string;
    size: number;
    uploadedAt: string;
    mime_type: string;
    conversion_performed: boolean;
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