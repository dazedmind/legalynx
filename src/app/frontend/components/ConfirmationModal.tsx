// src/app/frontend/components/SaveDocumentModal.tsx - Updated
import { Save, X, Cloud, Loader2 } from 'lucide-react'
import React from 'react'
import { GoQuestion } from 'react-icons/go';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shouldSave: boolean) => void;
  isSaving?: boolean;
  documentName?: string;
  modal: {
    header: string;
    message: string;
    trueButton: string;
    falseButton: string;
  }
}

function ConfirmationModal({ isOpen, onClose, onSave, isSaving, documentName, modal }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-md mx-4 border border-gray-200 max-w-md">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <GoQuestion className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">{modal.header}</h3>
          {documentName && (
            <p className="text-sm text-gray-600 mb-3 font-medium">"{documentName}"</p>
          )}
          <p className="text-gray-600">
            {modal.message}
          </p>
        </div>

        <div className="flex flex-row-reverse gap-2">
          <button
            onClick={() => onSave(true)}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {modal.trueButton}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {modal.trueButton}
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-full px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Please wait...' : modal.falseButton}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ConfirmationModal