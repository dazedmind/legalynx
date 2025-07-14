import { Save, X } from 'lucide-react'
import React from 'react'

interface SaveDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shouldSave: boolean) => void;
}

function SaveDocumentModal({ isOpen, onClose, onSave }: SaveDocumentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-md mx-4 border border-gray-200">
        <div className="flex items-center justify-center mb-2">
            <h3 className="text-2xl font-semibold text-gray-900">Save Document</h3>
    
        </div>
        
        <div className="mb-6">
            <p className="text-gray-600 text-center">
            Would you like to save it to your document library for future access?
            </p>
        </div>

        <div className="flex space-x-3">
            <button
            onClick={() => onClose()}
            className="flex-1 cursor-pointer px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
            Don't Save
            </button>
            <button
            onClick={() => onSave(true)}
            className="flex-1 cursor-pointer px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-2"
            >
            Save Document
            </button>
        </div>
        
        </div>
    </div>
    )
}

export default SaveDocumentModal