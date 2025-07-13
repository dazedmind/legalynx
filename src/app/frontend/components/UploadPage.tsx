// src/app/frontend/components/UploadPage.tsx
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { apiService, handleApiError, UploadResponse } from '../lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import { toast } from 'sonner';
import { authUtils } from '@/lib/auth'; // Import authUtils

interface UploadPageProps {
  onUploadSuccess: (response: UploadResponse) => void;
}

function UploadPage({ onUploadSuccess }: UploadPageProps) {
    const { isAuthenticated, user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    // Fixed: Use authUtils to get token from cookies consistently
    const getAuthHeaders = (): HeadersInit => {
        const token = authUtils.getToken(); // Get from cookies, not localStorage
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setUploadStatus('idle');
            setStatusMessage(null);
        } else {
            setFile(null);
            setUploadStatus('error');
            setStatusMessage('Please select a valid PDF file');
        }
    };

    const saveDocumentToDatabase = async (documentInfo: any) => {
        if (!isAuthenticated || !user) {
            // For non-authenticated users, just save to localStorage
            const storageKey = 'uploaded_documents';
            const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existingDocs.push(documentInfo);
            localStorage.setItem(storageKey, JSON.stringify(existingDocs));
            return documentInfo;
        }

        try {
            // Fixed: Use the /backend/api/documents/upload endpoint with FormData
            const formData = new FormData();
            if (file) {
                formData.append('file', file);
            }

            const response = await fetch('/backend/api/documents/upload', {
                method: 'POST',
                headers: {
                    // Don't set Content-Type for FormData, let browser set it
                    'Authorization': authUtils.getToken() ? `Bearer ${authUtils.getToken()}` : ''
                },
                body: formData
            });

            if (response.ok) {
                const savedDocument = await response.json();
                
                // Also save to localStorage for immediate access
                const storageKey = `uploaded_documents_${user.id}`;
                const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const localDocInfo = {
                    id: savedDocument.documentId || savedDocument.id,
                    filename: savedDocument.filename,
                    originalName: savedDocument.originalName,
                    size: savedDocument.size,
                    uploadedAt: savedDocument.uploadedAt,
                    pages: savedDocument.pages_processed || 1,
                    status: 'ready' as const,
                    databaseId: savedDocument.documentId || savedDocument.id
                };
                existingDocs.push(localDocInfo);
                localStorage.setItem(storageKey, JSON.stringify(existingDocs));
                
                return localDocInfo;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save document to database');
            }
        } catch (error) {
            console.error('Failed to save to database:', error);
            toast.error(`Document uploaded but failed to save to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            // Fallback to localStorage
            const storageKey = isAuthenticated && user?.id 
                ? `uploaded_documents_${user.id}` 
                : 'uploaded_documents';
            const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existingDocs.push(documentInfo);
            localStorage.setItem(storageKey, JSON.stringify(existingDocs));
            
            return documentInfo;
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus('error');
            setStatusMessage('Please select a PDF file first');
            return;
        }
    
        setIsUploading(true);
        setUploadStatus('processing');
        setStatusMessage('Processing document...');
    
        try {
            // For authenticated users, upload directly to database
            if (isAuthenticated && user) {
                const savedDocumentInfo = await saveDocumentToDatabase(null);
                
                setUploadStatus('success');
                setStatusMessage(
                    `Successfully processed document and saved to your account`
                );
                
                toast.success('Document uploaded and saved to your account!');
                
                // Call success callback
                if (onUploadSuccess) {
                    onUploadSuccess({
                        documentId: savedDocumentInfo.id,
                        filename: savedDocumentInfo.filename,
                        originalName: savedDocumentInfo.originalName,
                        size: savedDocumentInfo.size,
                        uploadedAt: savedDocumentInfo.uploadedAt,
                        pages_processed: savedDocumentInfo.pages
                    });
                }
            } else {
                // For non-authenticated users, use RAG system
                const response = await apiService.uploadPdf(file);
                
                // Create document info
                const documentInfo = {
                    id: Date.now().toString(),
                    filename: response.filename,
                    originalName: file.name,
                    size: file.size,
                    uploadedAt: new Date().toISOString(),
                    pages: response.pages_processed,
                    status: 'ready' as const
                };

                // Save to localStorage
                await saveDocumentToDatabase(documentInfo);
                
                setUploadStatus('success');
                setStatusMessage(
                    `Successfully processed ${response.pages_processed} pages from ${file.name}`
                );
                
                toast.success('Document uploaded successfully!');
                
                // Call success callback
                if (onUploadSuccess) {
                    onUploadSuccess({
                        documentId: documentInfo.id,
                        filename: response.filename,
                        originalName: file.name,
                        size: file.size,
                        uploadedAt: documentInfo.uploadedAt,
                        pages_processed: response.pages_processed
                    });
                }
            }
            
            // Reset form
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            setStatusMessage(handleApiError(error));
            toast.error('Upload failed: ' + handleApiError(error));
        } finally {
            setIsUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'application/pdf') {
            setFile(droppedFile);
            setUploadStatus('idle');
            setStatusMessage(null);
        } else {
            setUploadStatus('error');
            setStatusMessage('Please drop a valid PDF file');
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    uploadStatus === 'error'
                        ? 'border-red-300 bg-red-50'
                        : uploadStatus === 'success'
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleClick}
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
                    
                    <p className="text-xs text-gray-400">
                        Maximum file size: 50MB
                    </p>
                </div>
            </div>

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    !file || isUploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
                {isUploading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {uploadStatus === 'processing' ? 'Processing PDF...' : 'Uploading...'}
                    </div>
                ) : (
                    'Upload and Process PDF'
                )}
            </button>

            {/* Status Message */}
            {statusMessage && (
                <div
                    className={`p-4 rounded-md flex items-start text-sm ${
                        uploadStatus === 'success'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : uploadStatus === 'error'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                >
                    {uploadStatus === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    ) : uploadStatus === 'error' ? (
                        <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2 mt-0.5 flex-shrink-0"></div>
                    )}
                    <span>{statusMessage}</span>
                </div>
            )}

            {/* Authentication Notice */}
            {!isAuthenticated && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                    <p className="font-medium">Session Only Mode</p>
                    <p>Your document will be processed for this session only. <a href="/frontend/login" className="underline hover:text-yellow-900">Sign in</a> to save documents permanently.</p>
                </div>
            )}

            {/* Database Save Success Notice */}
            {isAuthenticated && uploadStatus === 'success' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
                    <p className="font-medium">Document Saved</p>
                    <p>Your document has been saved to your account and is available in "My Documents".</p>
                </div>
            )}
        </div>
    )
}

export default UploadPage