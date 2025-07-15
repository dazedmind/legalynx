// src/app/frontend/components/UploadPage.tsx - Updated with progress tracking
import { Upload, FileText, AlertCircle, CheckCircle2, MessageSquareDashed } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { apiService, handleApiError, UploadResponse } from '../lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import { toast } from 'sonner';
import { authUtils } from '@/lib/auth';
import UploadProgress from './UploadProgress';

interface UploadPageProps {
  onUploadSuccess: (response: UploadResponse) => void;
}

interface UploadingDocument {
  id: string;
  originalName: string;
  size: number;
  uploadStartTime: Date;
}

function UploadPage({ onUploadSuccess }: UploadPageProps) {
    const { isAuthenticated, user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
    const [uploadingDocument, setUploadingDocument] = useState<UploadingDocument | null>(null);

    // Fixed: Use authUtils to get token from cookies consistently
    const getAuthHeaders = (): HeadersInit => {
        const token = authUtils.getToken(); // Get from cookies, not localStorage
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
            setUploadingDocument(null);
        } else {
            setFile(null);
            setUploadStatus('error');
            setStatusMessage('Please select a valid PDF file');
        }
    };

    const saveDocumentToLocalStorage = async (documentInfo: any) => {
        // For non-authenticated users, save to localStorage
        const storageKey = 'uploaded_documents';
        const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existingDocs.push(documentInfo);
        localStorage.setItem(storageKey, JSON.stringify(existingDocs));
        return documentInfo;
    };

    const handleUpload = async () => {
        if (!file) {
            setUploadStatus('error');
            setStatusMessage('Please select a PDF file first');
            return;
        }
    
        setIsUploading(true);
        setUploadStatus('uploading');
        setStatusMessage('Uploading document...');
    
        try {
            if (isAuthenticated && user) {
                // For authenticated users, upload to database with S3 integration
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/backend/api/documents/upload', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: formData
                });

                if (response.ok) {
                    const savedDocument = await response.json();
                    
                    console.log('📄 Upload response:', savedDocument);
                    
                    // Check if document was processed successfully
                    if (savedDocument.status === 'TEMPORARY' && savedDocument.ragResult?.processed) {
                        // Document is ready immediately - no need for progress tracking
                        console.log('✅ Document processed immediately, skipping progress tracking');
                        
                        handleProcessingComplete({
                            id: savedDocument.documentId,
                            originalName: file.name,
                            size: file.size,
                            uploadedAt: savedDocument.uploaded_at,
                            pageCount: savedDocument.pages_processed,
                            status: savedDocument.status
                        });
                        
                        return; // Skip progress tracking
                    }
                    
                    // If not immediately ready, set up progress tracking
                    setUploadingDocument({
                        id: savedDocument.documentId,
                        originalName: file.name,
                        size: file.size,
                        uploadStartTime: new Date()
                    });
                    
                    setUploadStatus('processing');
                    setStatusMessage('Document uploaded successfully. Processing...');
                    
                    // Also save to localStorage for immediate access
                    const storageKey = `uploaded_documents_${user.id}`;
                    const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    const localDocInfo = {
                        id: savedDocument.documentId,
                        filename: savedDocument.file_name,
                        originalName: file.name,
                        size: file.size,
                        uploadedAt: savedDocument.uploaded_at,
                        pages: savedDocument.pages_processed || 1,
                        status: savedDocument.status || 'processing',
                        databaseId: savedDocument.documentId
                    };
                    existingDocs.push(localDocInfo);
                    localStorage.setItem(storageKey, JSON.stringify(existingDocs));
                    
                    toast.success('Document uploaded! Processing in progress...');
                    
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to upload document');
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
                    status: 'temporary' as const
                };

                // Save to localStorage
                await saveDocumentToLocalStorage(documentInfo);
                
                setUploadStatus('success');
                
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
                
                // Reset form
                setFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
            
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('error');
            setStatusMessage(handleApiError(error));
            toast.error('Upload failed: ' + handleApiError(error));
            setUploadingDocument(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleProcessingComplete = (document: any) => {
        console.log('📄 Processing complete for document:', document);
        
        setUploadStatus('success');
        setUploadingDocument(null);
        
        // Different messaging based on document status
        if (document.status === 'TEMPORARY') {
            setStatusMessage('Document ready for chat! Click "Save File" to store permanently.');
        } else {
            setStatusMessage('Document ready for use!');
        }
        
        // Call success callback
        if (onUploadSuccess) {
            onUploadSuccess({
                documentId: document.id,
                filename: document.originalName,
                originalName: document.originalName,
                size: document.size,
                uploadedAt: document.uploadedAt,
                pages_processed: document.pageCount || 1
            });
        }
        
        // Reset form
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleProcessingError = (error: string) => {
        setUploadStatus('error');
        setStatusMessage(error);
        setUploadingDocument(null);
        toast.error('Processing failed: ' + error);
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
            setUploadingDocument(null);
        } else {
            setUploadStatus('error');
            setStatusMessage('Please drop a valid PDF file');
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const resetUpload = () => {
        setFile(null);
        setUploadStatus('idle');
        setStatusMessage(null);
        setUploadingDocument(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Show progress tracker if document is being processed */}
            {uploadingDocument && (
                <UploadProgress
                    documentId={uploadingDocument.id}
                    onComplete={handleProcessingComplete}
                    onError={handleProcessingError}
                />
            )}

            {/* Upload Area - Hide when processing */}
            {!uploadingDocument && (
                <>
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

                            {file && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        resetUpload();
                                    }}
                                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                                >
                                    Remove file
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                            !file || isUploading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                        }`}
                    >
                        {isUploading ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}
                            </div>
                        ) : (
                            'Upload and Process PDF'
                        )}
                    </button>
                </>
            )}

            {/* Authentication Notice */}
            {isAuthenticated && !uploadingDocument && (
                <div className="flex items-center mt-4 gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                    <MessageSquareDashed className="w-10 h-10 mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                        <p className="font-medium">Session Only Mode</p>
                        <p>Your document will be processed for this session only. You have the option to save it permanently and access file storage.</p>
                    </span>
                </div>
            )}
        </div>
    )
}

export default UploadPage