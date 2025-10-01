import React from 'react'
import UploadComponent from './UploadComponent'
import { UploadResponse } from '../../../../lib/api';
interface UploadPageProps {
  onUploadSuccess: (response: UploadResponse) => void;
  handleNewChat?: () => void;
  onClearPreviousSession?: () => void;
}

export default function UploadPage({ 
  onUploadSuccess, 
  handleNewChat,
  onClearPreviousSession 
}: UploadPageProps) {
  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <UploadComponent
          onUploadSuccess={onUploadSuccess}
          handleNewChat={handleNewChat}
          onClearPreviousSession={onClearPreviousSession} // Pass it down
        />
      </div>
    </div>
  );
}