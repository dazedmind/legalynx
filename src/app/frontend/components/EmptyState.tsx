import React from 'react';
import { MessageSquare } from 'lucide-react';

interface EmptyStateProps {
  documentExists: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ documentExists }) => {
  return (
    <div className="text-center text-gray-500 py-12">
      <MessageSquare className="mx-auto w-12 h-12 mb-4" />
      <p className="text-lg font-medium">
        {documentExists ? 'Start a conversation' : 'Chat History'}
      </p>
      <p>
        {documentExists 
          ? 'Ask questions about your uploaded document.'
          : 'This document is no longer available.'
        }
      </p>
    </div>
  );
};