'use client'
import React, { useState, useRef } from 'react';
import { Upload, MessageSquare, FileText, AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

// [Inference] - Based on project knowledge patterns
interface UploadResponse {
  message: string;
  filename: string;
  pages_processed: number;
  status: string;
}

interface QueryResponse {
  query: string;
  response: string;
  source_count: number;
}

const UploadQueryTest: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResponse, setQueryResponse] = useState<QueryResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // [Unverified] - API endpoints based on project patterns, actual implementation may vary
  const handleFileUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    setUploadResponse(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/backend/api/upload-pdf', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result: UploadResponse = await response.json();
      setUploadResponse(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // [Unverified] - Query API endpoint based on project patterns
  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setIsQuerying(true);
    setQueryError(null);
    setQueryResponse(null);
    
    try {
      const response = await fetch('/backend/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: query.trim() })
      });
      
      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
      }
      
      const result: QueryResponse = await response.json();
      setQueryResponse(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Query failed';
      setQueryError(errorMessage);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setUploadError(null);
      setUploadResponse(null);
    } else {
      setFile(null);
      setUploadError('Please select a valid PDF file');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setUploadError(null);
      setUploadResponse(null);
    } else {
      setUploadError('Please drop a valid PDF file');
    }
  };

  const preventDefaults = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResponse(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload & Query Test</h1>
        <p className="text-gray-600">Test the file upload and document query functionality</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            File Upload Test
          </h2>
          
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              uploadError
                ? 'border-red-300 bg-red-50'
                : uploadResponse
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={preventDefaults}
            onDragEnter={preventDefaults}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex flex-col items-center">
              {file ? (
                <FileText className="w-12 h-12 text-blue-600 mb-3" />
              ) : (
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
              )}
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {file ? file.name : 'Upload PDF Document'}
              </h3>
              
              <p className="text-sm text-gray-500 mb-4">
                {file 
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload`
                  : 'Drag and drop your PDF here, or click to browse'
                }
              </p>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex gap-2">
            <button
              onClick={handleFileUpload}
              disabled={!file || isUploading}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                !file || isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload File'
              )}
            </button>
            
            {file && (
              <button
                onClick={resetUpload}
                className="px-4 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Reset
              </button>
            )}
          </div>

          {/* Upload Status */}
          {uploadResponse && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-800">Upload Successful</h4>
                  <p className="text-sm text-green-700 mt-1">{uploadResponse.message}</p>
                  <div className="text-xs text-green-600 mt-2 space-y-1">
                    <div>Filename: {uploadResponse.filename}</div>
                    <div>Pages processed: {uploadResponse.pages_processed}</div>
                    <div>Status: {uploadResponse.status}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Upload Failed</h4>
                  <p className="text-sm text-red-700 mt-1">{uploadError}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Query Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Query Test
          </h2>
          
          {/* Query Input */}
          <div className="space-y-3">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your question about the uploaded document..."
              className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              disabled={!uploadResponse}
            />
            
            <button
              onClick={handleQuery}
              disabled={!query.trim() || isQuerying || !uploadResponse}
              className={`w-full py-3 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
                !query.trim() || isQuerying || !uploadResponse
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isQuerying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Querying...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Query
                </>
              )}
            </button>
          </div>

          {!uploadResponse && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Upload Required</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please upload a PDF document first to enable querying.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Query Response */}
          {queryResponse && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">Query Response</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <div><strong>Query:</strong> {queryResponse.query}</div>
                <div><strong>Sources:</strong> {queryResponse.source_count}</div>
                <div className="bg-white p-3 rounded border">
                  <strong>Response:</strong>
                  <p className="mt-1 whitespace-pre-wrap">{queryResponse.response}</p>
                </div>
              </div>
            </div>
          )}

          {queryError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">Query Failed</h4>
                  <p className="text-sm text-red-700 mt-1">{queryError}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test Status */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="font-medium text-gray-800 mb-2">Test Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${uploadResponse ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Upload Function: {uploadResponse ? 'Working' : 'Not Tested'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${queryResponse ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Query Function: {queryResponse ? 'Working' : 'Not Tested'}</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-600 mt-3">
          [Unverified] API endpoints may need adjustment based on actual backend implementation.
          This test assumes standard REST API patterns found in the project knowledge.
        </p>
      </div>
    </div>
  );
};

export default UploadQueryTest;