// SessionLoader.tsx - Loading component for session transitions
'use client';

import React from 'react';
import { FileText, MessageSquare, Zap, Clock, Sparkles } from 'lucide-react';
import { Loader, LoaderType } from '@progress/kendo-react-indicators';

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
          icon: MessageSquare,
          title: "Loading Chat Session",
          description: "Retrieving conversation history",
          gradient: "from-blue-500 to-cyan-500"
        };
      case 'loading_document':
        return {
          icon: FileText,
          title: "Loading Document",
          description: "Fetching document from storage",
          gradient: "from-purple-500 to-pink-500"
        };
      case 'loading_rag':
        return {
          icon: Zap,
          title: "Initializing AI",
          description: "Processing document for intelligent search",
          gradient: "from-green-500 to-emerald-500"
        };
      case 'preparing_chat':
        return {
          icon: Sparkles,
          title: "Preparing Chat",
          description: "Setting up conversation interface",
          gradient: "from-orange-500 to-amber-500"
        };
      default:
        return {
          icon: MessageSquare,
          title: "Loading",
          description: "Please wait",
          gradient: "from-gray-500 to-slate-500"
        };
    }
  };

  const stageInfo = getStageInfo();
  const IconComponent = stageInfo.icon;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full">

        {/* Title & Description */}
        <div className="text-center space-y-1 mb-4">
          <h2 className={`text-2xl font-semibold bg-gradient-to-br ${stageInfo.gradient} bg-clip-text text-transparent`}>
            {stageInfo.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {stageInfo.description}
          </p>
        </div>

        {/* Document Info */}
        {documentName && (
          <div className="mb-8 px-4 py-3 rounded-xl bg-muted/50 border border-border backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate text-foreground/90 font-medium">{documentName}</span>
            </div>
          </div>
        )}

        {/* Loading Dots */}
        <div className="flex justify-center items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full bg-gradient-to-r ${stageInfo.gradient}`}
              style={{
                animation: 'bounce-dot 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>

      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes bounce-dot {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-6px) scale(1.2);
            opacity: 1;
          }
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
