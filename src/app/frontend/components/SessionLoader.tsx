// SessionLoader.tsx - Loading component for session transitions
'use client';

import React from 'react';
import { FileText, MessageSquare, Zap, Clock } from 'lucide-react';

interface SessionLoaderProps {
  sessionTitle?: string;
  documentName?: string;
  stage?: 'loading_session' | 'loading_document' | 'loading_rag' | 'preparing_chat';
}

export default function SessionLoader({ 
  sessionTitle = "Loading session...", 
  documentName,
  stage = 'loading_session'
}: SessionLoaderProps) {
  
  const getStageInfo = () => {
    switch (stage) {
      case 'loading_session':
        return {
          icon: <MessageSquare className="w-6 h-6" />,
          title: "Loading Chat Session",
          description: "Retrieving conversation history...",
          color: "text-blue-600"
        };
      case 'loading_document':
        return {
          icon: <FileText className="w-6 h-6" />,
          title: "Loading Document",
          description: "Fetching document from storage...",
          color: "text-purple-600"
        };
      case 'loading_rag':
        return {
          icon: <Zap className="w-6 h-6" />,
          title: "Initializing AI",
          description: "Processing document for intelligent search...",
          color: "text-green-600"
        };
      case 'preparing_chat':
        return {
          icon: <Clock className="w-6 h-6" />,
          title: "Preparing Chat",
          description: "Setting up conversation interface...",
          color: "text-orange-600"
        };
      default:
        return {
          icon: <MessageSquare className="w-6 h-6" />,
          title: "Loading",
          description: "Please wait...",
          color: "text-gray-600"
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        
        {/* Animated Icon */}
        <div className={`${stageInfo.color} mb-6 flex justify-center`}>
          <div className="relative">
            <div className="animate-pulse">
              {stageInfo.icon}
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {stageInfo.title}
        </h2>

        {/* Session/Document Info */}
        {sessionTitle && (
          <div className="bg-primary rounded-lg p-4 mb-4 shadow-sm border">
            <p className="font-medium text-foreground truncate">
              {sessionTitle}
            </p>
            {documentName && (
              <div className="flex items-center justify-center mt-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4 mr-1" />
                <span className="truncate">{documentName}</span>
              </div>
            )}
          </div>
        )}

        {/* Stage Description */}
        <p className="text-muted-foreground mb-6">
          {stageInfo.description}
        </p>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${stageInfo.color.replace('text-', 'bg-')} opacity-30 animate-pulse`}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1.4s'
              }}
            />
          ))}
        </div>

        {/* Loading Bar */}
        <div className="w-full bg-tertiary rounded-full h-1 overflow-hidden">
          <div 
            className={`h-full ${stageInfo.color.replace('text-', 'bg-')} rounded-full animate-pulse`}
            style={{
              width: '60%',
              animation: 'loading 2s ease-in-out infinite'
            }}
          />
        </div>

        {/* Helpful tip */}
        <div className="mt-8 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-500">
            💡 Large documents may take a few moments to process
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% { transform: translateX(-100%); width: 0%; }
          50% { width: 60%; }
          100% { transform: translateX(100%); width: 60%; }
        }
      `}</style>
    </div>
  );
}