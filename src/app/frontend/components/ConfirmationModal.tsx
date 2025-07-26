// src/app/frontend/components/SaveDocumentModal.tsx - Updated
import { Save, Loader2, DownloadCloud } from 'lucide-react'
import React from 'react'
import { GoQuestion, GoAlert, GoCheck, GoInfo} from 'react-icons/go';

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
    type: string;
  }
}

const getColor = (type: string) => {
  switch (type) {
    case ModalType.DANGER:
      return 'bg-red-100/70 text-red-600 hover:bg-red-300';
    case ModalType.WARNING:
      return 'bg-yellow-100/70 text-yellow-600 hover:bg-yellow-200';
    case ModalType.INFO:
      return 'bg-blue-100/70 text-blue-600 hover:bg-blue-300';
    case ModalType.SUCCESS:
      return 'bg-green-100/70 text-green-600 hover:bg-green-300';
    case ModalType.ERROR:
      return 'bg-red-100/70 text-red-600 hover:bg-red-300';
    case ModalType.SAVE:
      return 'bg-blue-100/70 text-blue-600 hover:bg-blue-300';
  }
}

const getIcon = (type: string) => { 
  switch (type) {
    case ModalType.DANGER:
      return <GoAlert className="w-8 h-8" />;
    case ModalType.WARNING:
      return <GoAlert className="w-8 h-8" />;
    case ModalType.INFO:
      return <GoInfo className="w-8 h-8" />;
    case ModalType.SUCCESS:
      return <GoCheck className="w-8 h-8" />;
    case ModalType.ERROR:
      return <GoAlert className="w-8 h-8" />;
    case ModalType.SAVE:
      return <DownloadCloud className="w-8 h-8" />;
  }
}

export const ModalType = {
  DELETE: 'delete',
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
  SAVE: 'save',
}

function ConfirmationModal({ isOpen, onClose, onSave, isSaving, documentName, modal }: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-md mx-4 border border-gray-200 max-w-md">
        <div className="flex items-center justify-center mb-2">
          <div className={`p-3 rounded-full ${getColor(modal.type)}`}>
            {getIcon(modal.type)}
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">{modal.header}</h3>
          {documentName && (
            <p className="text-sm text-gray-600 mb-3 font-medium">"{documentName}"</p>
          )}
          <p className="text-gray-600 text-sm">
            {modal.message}
          </p>
        </div>

        <div className="flex flex-row-reverse gap-2">
          <button
            onClick={() => onSave(true)}
            disabled={isSaving}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${getColor(modal.type)} rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {modal.trueButton}
              </>
            ) : (
              <>
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