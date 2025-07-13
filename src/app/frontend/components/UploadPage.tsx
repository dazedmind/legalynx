import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { apiService, handleApiError, UploadResponse } from '../lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import { toast } from 'sonner';

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

    // Helper function to get auth headers
    const getAuthHeaders = (): HeadersInit => {
        const token = localStorage.getItem('legalynx_token');
        const headers: HeadersInit = {};
        
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
            // Save to database for authenticated users
            const response = await fetch('/backend/api/documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    userId: user.id,
                    filename: documentInfo.filename,
                    originalName: documentInfo.originalName,
                    size: documentInfo.size,
                    pages: documentInfo.pages,
                    fileType: 'PDF',
                    status: 'PROCESSED',
                    metadata: {
                        uploadedAt: documentInfo.uploadedAt,
                        processingTime: 0, // You can add this if needed
                        ragIndexed: true
                    }
                })
            });

            if (response.ok) {
                const savedDocument = await response.json();
                
                // Also save to localStorage for immediate access
                const storageKey = `uploaded_documents_${user.id}`;
                const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const localDocInfo = {
                    ...documentInfo,
                    id: savedDocument.id, // Use database ID
                    databaseId: savedDocument.id
                };
                existingDocs.push(localDocInfo);
                localStorage.setItem(storageKey, JSON.stringify(existingDocs));
                
                return localDocInfo;
            } else {
                throw new Error('Failed to save document to database');
            }
        } catch (error) {
            console.error('Failed to save to database:', error);
            toast.error('Document uploaded but failed to save to database');
            
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
            // First, upload to RAG system
            const response = await apiService.uploadPdf(file);
            
            // Create document info
            const documentInfo = {
                id: Date.now().toString(), // Temporary ID, will be replaced if saved to DB
                filename: response.filename,
                originalName: file.name,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                pages: response.pages_processed,
                status: 'ready' as const
            };

            // Save to database (and localStorage)
            const savedDocumentInfo = await saveDocumentToDatabase(documentInfo);
            
            // Create standardized response for the callback
            const standardizedResponse: UploadResponse = {
                documentId: savedDocumentInfo.id,
                filename: response.filename,
                originalName: file.name,
                size: file.size,
                uploadedAt: savedDocumentInfo.uploadedAt,
                pages_processed: response.pages_processed
            };
            
            setUploadStatus('success');
            setStatusMessage(
                `Successfully processed ${response.pages_processed} pages from ${file.name}${
                    isAuthenticated ? ' and saved to your account' : ''
                }`
            );
            
            toast.success(
                isAuthenticated 
                    ? 'Document uploaded and saved to your account!' 
                    : 'Document uploaded successfully!'
            );
            
            // Call the callback to transition to chat
            onUploadSuccess(standardizedResponse);
            
        } catch (error) {
            setUploadStatus('error');
            setStatusMessage(handleApiError(error));
            toast.error('Upload failed');
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

    const resetUpload = () => {
        setFile(null);
        setStatusMessage(null);
        setUploadStatus('idle');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex-1 flex flex-col justify-center p-8 max-w-2xl mx-auto w-full">
            {/* Upload Instructions */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Document</h2>
                <p className="text-gray-600">
                    {isAuthenticated 
                        ? "Upload a PDF document to save it to your account and start chatting"
                        : "Upload a PDF document to start chatting (session only)"
                    }
                </p>
            </div>

            {/* File Upload Area */}
            <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${
                    file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {file ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            <span className="font-medium text-green-800">{file.name}</span>
                            <span className="text-sm text-green-600">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                        </div>
                        <button
                            onClick={resetUpload}
                            className="text-sm text-red-600 hover:text-red-800 underline"
                            disabled={isUploading}
                        >
                            Remove
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <div>
                            <span className="text-gray-600">
                                Drop PDF here or{' '}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                    disabled={isUploading}
                                >
                                    browse files
                                </button>
                            </span>
                            <p className="text-sm text-gray-500 mt-1">Supports PDF files up to 50MB</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Upload Button */}
            <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors mb-4 ${
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