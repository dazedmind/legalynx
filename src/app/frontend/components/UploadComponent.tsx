'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';  
import { apiService, handleApiError, UploadResponse } from '../lib/api';

interface UploadComponentProps {
  onUploadSuccess: (response: UploadResponse) => void;
}

export default function UploadComponent({ onUploadSuccess }: UploadComponentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setUploadStatus('idle');
      setStatusMessage('');
    } else {
      setFile(null);
      setUploadStatus('error');
      setStatusMessage('Please select a valid PDF file');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setUploadStatus('idle');
      setStatusMessage('');
    } else {
      setUploadStatus('error');
      setStatusMessage('Please drop a valid PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('error');
      setStatusMessage('Please select a PDF file first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setStatusMessage('');

    try {
      const response = await apiService.uploadPdf(file);
      setUploadStatus('success');
      setStatusMessage(`Successfully processed ${response.pages_processed} pages from ${response.filename}`);
      onUploadSuccess(response);
    } catch (error) {
      setUploadStatus('error');
      setStatusMessage(handleApiError(error));
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setUploadStatus('idle');
    setStatusMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload PDF Document</h2>
      
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          file
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="space-y-2">
            <FileText className="mx-auto w-12 h-12 text-green-600" />
            <p className="text-lg font-medium text-green-800">{file.name}</p>
            <p className="text-sm text-green-600">
              Size: {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <button
              onClick={resetUpload}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto w-12 h-12 text-gray-400" />
            <p className="text-lg text-gray-600">
              Drag and drop your PDF here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                browse files
              </button>
            </p>
            <p className="text-sm text-gray-500">Supports PDF files up to 50MB</p>
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
      <div className="mt-4">
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
              Processing PDF...
            </div>
          ) : (
            'Upload and Process PDF'
          )}
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`mt-4 p-4 rounded-md flex items-start ${
            uploadStatus === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {uploadStatus === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}