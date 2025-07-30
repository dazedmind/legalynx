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
      return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
    case ModalType.WARNING:
      return 'bg-yellow/20 text-yellow-600 hover:bg-yellow/30';
    case ModalType.INFO:
      return 'bg-blue/20 text-blue-600 hover:bg-blue/30';
    case ModalType.SUCCESS:
      return 'bg-green/20 text-green-600 hover:bg-green/30';
    case ModalType.ERROR:
      return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
    case ModalType.SAVE:
      return 'bg-blue/20 text-blue-600 hover:bg-blue/30';
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
      <div className="bg-primary rounded-lg p-6 w-md mx-4 border border-tertiary max-w-md">
        <div className="flex items-center justify-center mb-2">
          <div className={`p-3 rounded-full ${getColor(modal.type)}`}>
            {getIcon(modal.type)}
          </div>
        </div>
        
        <div className="text-center mb-6">
          <h3 className="text-2xl font-semibold text-foreground mb-2">{modal.header}</h3>
          {documentName && (
            <p className="text-sm text-muted-foreground mb-3 font-medium">"{documentName}"</p>
          )}
          <p className="text-muted-foreground text-sm">
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
            className="w-full px-4 py-3 text-foreground bg-tertiary hover:bg-accent rounded-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Please wait...' : modal.falseButton}
          </button>
        </div>

      </div>
    </div>
  )
}

export default ConfirmationModal