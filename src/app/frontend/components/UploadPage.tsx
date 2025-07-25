import React from 'react'
import UploadComponent from './UploadComponent'
import { UploadResponse } from '../lib/api';

interface UploadPageProps {
  onUploadSuccess: (response: UploadResponse) => void;
}

function UploadPage({ onUploadSuccess }: UploadPageProps) {
  return (
    <div className="flex-1 flex flex-col justify-center p-8 max-w-2xl mx-auto my-12 md:my-18 w-full">
      <UploadComponent onUploadSuccess={onUploadSuccess} />

    </div>
  )
}

export default UploadPage