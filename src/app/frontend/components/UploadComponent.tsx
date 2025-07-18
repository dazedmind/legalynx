// Updated UploadPage.tsx with hybrid upload approach
import { Upload, FileText, AlertCircle, CheckCircle2, MessageSquareDashed } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { apiService, handleApiError, UploadResponse } from '../lib/api';
import { useAuth } from '@/lib/context/AuthContext';
import { toast } from 'sonner';
import { authUtils } from '@/lib/auth';

interface UploadPageProps {
  onUploadSuccess: (response: UploadResponse) => void;
  handleNewChat?: () => void;
}

function UploadComponent({ onUploadSuccess, handleNewChat }: UploadPageProps) {
    const { isAuthenticated, user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

    const getAuthHeaders = (): HeadersInit => {
        const token = authUtils.getToken();
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

    const saveDocumentToDatabase = async (file: File): Promise<any> => {
        if (!isAuthenticated || !user) {
            console.log('👤 User not authenticated, skipping database save');
            return null;
        }

        try {
            console.log('💾 Saving to database for authenticated user...');
            
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/backend/api/documents/upload', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData
            });

            if (response.ok) {
                const savedDocument = await response.json();
                console.log('✅ Document saved to database:', savedDocument);
                return savedDocument;
            } else {
                const errorData = await response.json();
                console.error('❌ Database save failed:', errorData);
                throw new Error(errorData.error || 'Failed to save to database');
            }
        } catch (error) {
            console.error('❌ Database save error:', error);
            throw error;
        }
    };

    const uploadToRagSystem = async (file: File): Promise<any> => {
        try {
            console.log('🔄 Uploading to RAG system...');
            const ragResponse = await apiService.uploadPdf(file);
            console.log('✅ RAG upload successful:', ragResponse);
            return ragResponse;
        } catch (error) {
            console.error('❌ RAG upload failed:', error);
            throw error;
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
            let documentInfo: any = null;
            let ragResponse: any = null;

            if (isAuthenticated && user) {
                // For authenticated users: Save to database first, then RAG system
                console.log('👤 Authenticated user - hybrid upload');
                
                try {
                    // Step 1: Save to database
                    setStatusMessage('Reading file content...');
                    documentInfo = await saveDocumentToDatabase(file);
                    
                    // Step 2: Upload to RAG system
                    setStatusMessage('Processing document for AI analysis...');
                    ragResponse = await uploadToRagSystem(file);
                    
                    setUploadStatus('success');
                    setStatusMessage('Document saved to your account and ready for AI analysis!');                    
                } catch (error) {
                    console.error('Hybrid upload failed, trying RAG only:', error);
                    
                    // Fallback: Just use RAG system
                    setStatusMessage('Saving to account failed, processing for session only...');
                    ragResponse = await uploadToRagSystem(file);
                    
                    setUploadStatus('success');
                    setStatusMessage('Document processed for this session (not saved to account)');
                    
                    toast.warning('Document processed but not saved to account');
                }
            } else {
                // For non-authenticated users: RAG system only
                console.log('👥 Non-authenticated user - RAG only');
                
                setStatusMessage('Processing document for this session...');
                ragResponse = await uploadToRagSystem(file);
                
                setUploadStatus('success');
                setStatusMessage('Document processed for this session only');
                
                toast.success('Document uploaded successfully!');
            }

            // Prepare response for parent component
            const uploadResponse: UploadResponse = {
                documentId: documentInfo?.documentId || documentInfo?.id || Date.now().toString(),
                filename: ragResponse?.filename || file.name,
                originalName: file.name,
                size: file.size,
                uploadedAt: documentInfo?.uploadedAt || new Date().toISOString(),
                pages_processed: ragResponse?.pages_processed || 1,
                status: documentInfo ? 'TEMPORARY' : 'TEMPORARY'
            };

            // Save to localStorage for immediate access
            const storageKey = isAuthenticated && user?.id 
                ? `uploaded_documents_${user.id}` 
                : 'uploaded_documents';
            
            const existingDocs = JSON.parse(localStorage.getItem(storageKey) || '[]');
            existingDocs.push({
                ...uploadResponse,
                databaseId: documentInfo?.documentId || documentInfo?.id
            });
            localStorage.setItem(storageKey, JSON.stringify(existingDocs));

            // Call success callback
            onUploadSuccess(uploadResponse);
            
            // Reset form
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            
        } catch (error) {
            console.error('❌ Upload failed completely:', error);
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

            <div>
                <h1 className='font-serif text-2xl font-bold text-gray-900'>To get started, upload a PDF document below</h1>
            </div>
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
                        : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                }`}
            >
                {isUploading ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {uploadStatus === 'processing' ? statusMessage : 'Uploading...'}
                    </div>
                ) : (
                    'Upload File'
                )}
            </button>
   
            <div className="mt-4 p-4 flex gap-4 items-center bg-gray-50 border-dashed border-2 border-neutral-400 rounded-md text-neutral-800 text-sm">
                <MessageSquareDashed className="w-10 h-10 mt-0.5 flex-shrink-0" />
                <span className="flex flex-col">
                    <p className="font-medium">Session Only Mode</p>
                    <p>Your document will be processed for this session only and will be deleted right after you sign out. You have the option to save documents permanently.</p>
                </span>

            </div>

    
        </div>
    )
}

export default UploadComponent