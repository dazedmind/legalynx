'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Brain, Zap } from 'lucide-react';
import { apiService, handleApiError, SystemStatus, UploadResponse } from './frontend/lib/api';
import { Button } from '@/components/ui/button';
import Header from './frontend/components/Header';
import BlurText from './frontend/components/reactbits/BlurText';
import Image from 'next/image';
import heroImg from './frontend/img/document-hero.png'
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <Header />
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className='flex items-center my-30 justify-between gap-2'>
          <span className='flex flex-col items-start justify-center gap-2'>
            <BlurText text="LegalynX" className='text-6xl font-bold font-serif' />
            <p className='text-2xl text-gray-600'>Linking you to legal clarity</p>
            <Link href="/frontend/pricing">
              <Button className='cursor-pointer hover:brightness-110 transition-all duration-300'>Get Started</Button>
            </Link>
          </span>
  

          <div>
              <Image 
              src={heroImg} 
              alt="LegalynX Logo" 
              width={400} 
              height={400} 
              className='fade-gradient'
              />
          </div>
        </div>


        {/* Features Info */}
        <div className="mt-8">
          <h3 className="text-4xl font-bold text-gray-800 mb-6 text-center">Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
            <div className="text-center border-2 border-gray-200 rounded-lg p-6 bg-white">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Smart PDF Processing</h4>
              <p className="text-sm text-gray-600">
                Automatically detects document type and applies OCR for scanned PDFs or direct text extraction for structured documents.
              </p>
            </div>
            <div className="text-center border-2 border-gray-200 rounded-lg p-6 bg-white">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Brain className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Hybrid Retrieval</h4>
              <p className="text-sm text-gray-600">
                Combines vector search, keyword matching (BM25), and semantic chunking for optimal information retrieval.
              </p>
            </div>
            <div className="text-center border-2 border-gray-200 rounded-lg p-6 bg-white">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Advanced Analysis</h4>
              <p className="text-sm text-gray-600">
                Query analysis, reranking demonstration, and detailed source attribution for transparent AI responses.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>RAG Pipeline - Powered by LlamaIndex, Google Gemini & Next.js</p>
            <p className="mt-1">
              Upload a PDF document to get started with intelligent document analysis
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}