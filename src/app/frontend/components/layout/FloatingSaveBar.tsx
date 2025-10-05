import { Loader2 } from "lucide-react";

interface FloatingSaveBarProps {
    isVisible: boolean;
    onSave: () => void;
    onDiscard: () => void;
    isSaving: boolean;
}

export const FloatingSaveBar = ({ 
    isVisible, 
    onSave,     
    onDiscard, 
    isSaving 
  }: FloatingSaveBarProps) => {
    return (
      <div 
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
          isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-16 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-primary/50 backdrop-blur-sm border border-tertiary rounded-lg shadow-lg p-4 w-xs md:min-w-3xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium text-sm md:text-base text-foreground">You have unsaved changes</p>
                <p className="hidden md:block text-xs text-muted-foreground">Your settings will be lost if you leave without saving</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onDiscard}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-tertiary rounded-md hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span className='hidden md:block'>Discard</span>
                <span className='block md:hidden'>Cancel</span>
              </button>
              
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <span className='hidden md:block'>Save Changes</span>
                    <span className='block md:hidden'>Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };