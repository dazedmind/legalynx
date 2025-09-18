import React from 'react'
import InputField from './ui/InputField'
import { Button } from '@/components/ui/button'

function ForgotPasswordModal({showForgotPasswordSuccess, handleForgotPasswordSubmit, handleCloseForgotPasswordModal, forgotPasswordEmail, setForgotPasswordEmail, forgotPasswordMessage, isForgotPasswordLoading}: {showForgotPasswordSuccess: boolean, handleForgotPasswordSubmit: (e: React.FormEvent<HTMLFormElement>) => void, handleCloseForgotPasswordModal: () => void, forgotPasswordEmail: string, setForgotPasswordEmail: (email: string) => void, forgotPasswordMessage: string, isForgotPasswordLoading: boolean}) {
  return (
    <>
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white border-2 rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 animate-modal-in">
            {!showForgotPasswordSuccess ? (
              <form onSubmit={handleForgotPasswordSubmit}>
                <h2 className="text-2xl font-bold text-gold mb-4 text-center">Reset Password</h2>
                <p className="text-gray-600 mb-2 text-center text-sm">
                  Enter your email address and we&apos;ll send you instructions to reset your password.
                </p>
                
                <div className="mb-4">
                  <InputField
                    type="email"
                    name="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-auto"
                    id="email"
                    placeholder="Enter your email"
                    label=""
                  />
                </div>

                {forgotPasswordMessage && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{forgotPasswordMessage}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={handleCloseForgotPasswordModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium cursor-pointer text-sm"
                    disabled={isForgotPasswordLoading}
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isForgotPasswordLoading || !forgotPasswordEmail.trim()}
                    className={`px-6 py-2 hover:brightness-105 rounded-lg font-semibold transition-all duration-300 ${
                      (isForgotPasswordLoading || !forgotPasswordEmail.trim()) 
                        ? 'opacity-70 cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    {isForgotPasswordLoading ? "Sending..." : "Send Instructions"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-blue mb-4">Instructions Sent!</h2>
                <p className="text-gray-600 mb-6 text-sm">
                  {forgotPasswordMessage}
                </p>
                <button
                  onClick={handleCloseForgotPasswordModal}
                  className="px-6 py-2 bg-blue-600 cursor-pointer hover:brightness-105 text-white rounded-lg font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      
    </>
  )
}

export default ForgotPasswordModal