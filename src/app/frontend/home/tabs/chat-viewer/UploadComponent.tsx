// Fixed version of the UploadComponent with proper state management
import {
  Upload,
  FileText,
  MessageSquareDashed,
} from "lucide-react";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { handleApiError, UploadResponse } from "../../../lib/api";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { authUtils } from "@/lib/auth";
import BlurText from "../../../components/reactbits/BlurText";
import {
  getSecurityErrorMessage,
  isSecurityError,
} from "../../../lib/api";

interface UploadPageProps {
  onUploadSuccess: (response: UploadResponse) => void;
  handleNewChat?: () => void;
  onClearPreviousSession?: () => void;
}

interface UploadOptions {
  supported_file_types: Array<{
    extension: string;
    description: string;
    max_size_mb: number;
  }>;
  max_file_size_mb: number;
  supported_text_extraction: string[];
  not_supported: string[];
}

interface UserSettings {
  file_naming_format: "ORIGINAL" | "ADD_TIMESTAMP" | "SEQUENTIAL_NUMBERING";
  title?: string;
  client_name?: string;
}

// Progress Bar Component
interface ProgressStepProps {
  currentStep: number;
  steps: string[];
  stepProgress: number; // 0-100 for current step
}

const ProgressSteps: React.FC<ProgressStepProps> = ({ currentStep, steps, stepProgress }) => {
  const getStepColor = (stepIndex: number) => {
    switch(stepIndex) {
      case 0: return 'bg-blue-600'; // Initializing - Blue
      case 1: return 'bg-purple-600'; // Processing - Purple  
      case 2: return 'bg-yellow-500'; // Preparing - Yellow
      default: return 'bg-blue-600';
    }
  };

  const getTextColor = (stepIndex: number) => {
    switch(stepIndex) {
      case 0: return 'text-blue-600'; // Initializing - Blue
      case 1: return 'text-purple-600'; // Processing - Purple
      case 2: return 'text-yellow-600'; // Preparing - Yellow
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Progress Bar */}
      <div className="w-full bg-tertiary rounded-full h-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out ${getStepColor(currentStep)}`}
          style={{ 
            width: `${stepProgress}%` 
          }}
        />
      </div>
      
      {/* Step Labels */}
      <div className="flex justify-between text-xs">
        {steps.map((step, index) => (
          <span 
            key={index}
            className={`transition-colors duration-300 ${
              index === currentStep 
                ? `${getTextColor(index)} font-medium` 
                : index < currentStep
                ? 'text-muted-foreground opacity-50 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
};

function UploadComponent({
  onUploadSuccess,
  handleNewChat,
  onClearPreviousSession,
}: UploadPageProps) {
  const { isAuthenticated, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [warning, setWarning] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  // Progress tracking
  const [currentProgressStep, setCurrentProgressStep] = useState(-1);
  const [stepProgress, setStepProgress] = useState(0);
  const progressSteps = ["Initializing", "Processing", "Preparing"];

  // User settings and upload options
  const [uploadOptions, setUploadOptions] = useState<UploadOptions>({
    supported_file_types: [
      {
        extension: ".pdf",
        description: "PDF documents with extractable text",
        max_size_mb: 50,
      },
      {
        extension: ".docx",
        description: "Microsoft Word documents (will be converted to PDF)",
        max_size_mb: 50,
      },
    ],
    max_file_size_mb: 50,
    supported_text_extraction: [
      "Text-based PDFs",
      "Word documents (DOCX)",
      "Documents with selectable text",
    ],
    not_supported: [
      "Scanned documents",
      "Image-based PDFs",
      "Password-protected files",
    ],
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    file_naming_format: "ORIGINAL",
  });
  const [loadingSettings, setLoadingSettings] = useState(false);

  // ✅ FIX: Create a memoized callback to prevent unnecessary re-renders
  const clearPreviousSession = useCallback(() => {
    if (onClearPreviousSession) {
      // ✅ FIX: Use setTimeout to defer the state update until after render
      setTimeout(() => {
        onClearPreviousSession();
      }, 0);
    }
  }, [onClearPreviousSession]);

  // Load upload options and user settings on component mount
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!isAuthenticated || !user) {
        setUserSettings({
          file_naming_format: "ORIGINAL",
        });
        return;
      }

      setLoadingSettings(true);
      try {
        const response = await fetch("/backend/api/user/settings", {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const settings = await response.json();
          setUserSettings({
            file_naming_format: settings.fileNamingFormat || "ORIGINAL",
            title: settings.fileNamingTitle || undefined,
            client_name: settings.fileClientName || undefined,
          });
          console.log("✅ Loaded user settings:", settings);
        } else {
          setUserSettings({
            file_naming_format: "ORIGINAL",
          });
        }
      } catch (error) {
        console.error("Failed to load user settings:", error);
        setUserSettings({
          file_naming_format: "ORIGINAL",
        });
      } finally {
        setLoadingSettings(false);
      }
    };
    loadUserSettings();
  }, [isAuthenticated, user]);

  const getAuthHeaders = (): HeadersInit => {
    const token = authUtils.getToken();
    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExt = selectedFile.name.toLowerCase().split(".").pop();
      const supportedExts = uploadOptions?.supported_file_types?.map((t) =>
        t.extension.replace(".", "")
      ) || ["pdf", "docx"];

      if (supportedExts.includes(fileExt || "")) {
        setFile(selectedFile);
        setUploadStatus("idle");
        setStatusMessage(null);
        setWarning(null);
        setCurrentProgressStep(-1);
        setStepProgress(0);

        const maxSizeMB = uploadOptions?.max_file_size_mb || 50;
        if (selectedFile.size > maxSizeMB * 1024 * 1024) {
          setUploadStatus("error");
          setStatusMessage(`File size too large. Maximum: ${maxSizeMB}MB`);
          return;
        }
      } else {
        setFile(null);
        setUploadStatus("error");
        setStatusMessage(
          `Unsupported file type. Supported: ${supportedExts
            .join(", ")
            .toUpperCase()}`
        );
        toast.error("Unsupported file type. Please select a valid PDF or DOCX file.");
      }
    }
  };
  
  const saveDocumentToDatabaseWithFilename = async (
    file: File,
    ragFilename: string
  ): Promise<any> => {
    if (!isAuthenticated || !user) {
      console.log("👤 User not authenticated, skipping database save");
      return null;
    }

    try {
      console.log("💾 Saving to database with RAG filename:", ragFilename);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("intelligent_filename", ragFilename);

      const response = await fetch("/backend/api/documents/upload", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (response.ok) {
        const savedDocument = await response.json();
        console.log(
          "✅ Document saved to database with RAG filename:",
          savedDocument
        );
        return savedDocument;
      } else {
        const errorData = await response.json();
        console.error("❌ Database save failed:", errorData);
        throw new Error(errorData.error || "Failed to save to database");
      }
    } catch (error) {
      console.error("❌ Database save error:", error);
      throw error;
    }
  };

  const verifyDocumentIsActive = async (documentId: string) => {
    try {
      const isDevelopment = process.env.NODE_ENV === "development";
      const RAG_BASE_URL = isDevelopment
        ? "http://localhost:8000"
        : process.env.NEXT_PUBLIC_RAG_API_URL;
  
      const sessionId = getSessionId();
  
      const response = await fetch(`${RAG_BASE_URL}/current-document`, {
        method: "GET",
        headers: {
          // Include authentication if available
          ...(isAuthenticated ? getAuthHeaders() : {}),
          // Include session ID for proper isolation
          'X-Session-Id': sessionId,
        },
      });
  
      if (response.ok) {
        const currentDoc = await response.json();
        console.log("📄 Current document on backend:", currentDoc);
  
        if (currentDoc.document_id !== documentId) {
          console.warn(
            `⚠️ Document ID mismatch! Expected: ${documentId}, Current: ${currentDoc.document_id}`
          );
        } else {
          console.log(
            `✅ Document ${documentId} verified as active on backend`
          );
        }
      } else {
        console.warn("⚠️ Could not verify document is active on backend");
      }
    } catch (error) {
      console.warn("⚠️ Document verification failed:", error);
    }
  };

  const getSessionId = () => {
    // Try to get existing session ID from localStorage or generate new one
    let sessionId = localStorage.getItem('rag_session_id');
    if (!sessionId) {
      // Generate a unique session ID
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('rag_session_id', sessionId);
    }
    return sessionId;
  };

  const uploadToRagSystem = async (file: File): Promise<any> => {
    try {
      console.log("🚀 Uploading to RAG system...");
  
      // [Unverified] Move the session clearing to be asynchronous to prevent setState during render
      if (onClearPreviousSession) {
        console.log("🧹 Clearing previous frontend session state");
        // Use setTimeout to prevent setState during render
        setTimeout(() => onClearPreviousSession(), 0);
      }
  
      const isDevelopment = process.env.NODE_ENV === "development";
      // Use the same URL consistently - MODIFY: Update to use correct port
      const RAG_BASE_URL = isDevelopment
        ? "http://localhost:8000"  // Updated to match Railway backend port
        : process.env.NEXT_PUBLIC_RAG_API_URL;
  
      console.log("🔗 Using RAG URL:", RAG_BASE_URL);
  
      // Convert enum to string format expected by backend
      const getNamingOption = (format: string) => {
        switch (format) {
          case "ORIGINAL":
            return "keep_original";
          case "ADD_TIMESTAMP":
            return "add_timestamp";
          case "SEQUENTIAL_NUMBERING":
            return "sequential_numbering";
          default:
            return "keep_original";
        }
      };
  
      // Prepare form data with user settings
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "naming_option",
        getNamingOption(userSettings?.file_naming_format || "ORIGINAL")
      );
  
      if (userSettings?.title?.trim()) {
        formData.append("title", userSettings.title.trim());
      }
      if (userSettings?.client_name?.trim()) {
        formData.append("client_name", userSettings.client_name.trim());
      }
  
      // ADD: Include session ID for proper isolation
      const sessionId = getSessionId();
  
      const response = await fetch(`${RAG_BASE_URL}/upload-pdf-ultra-fast`, {
        method: "POST",
        body: formData,
        headers: {
          // Include authentication if available
          ...(isAuthenticated ? getAuthHeaders() : {}),
          // Include session ID for anonymous users
          'X-Session-Id': sessionId,
        },
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }
  
      const ragResponse = await response.json();
      console.log("✅ RAG upload successful:", ragResponse);
      console.log(`🆔 NEW Document ID: ${ragResponse.document_id}`);
      console.log(
        `⚡ Processing time: ${ragResponse.processing_time?.toFixed(2)}s`
      );
  
      await verifyDocumentIsActive(ragResponse.document_id);
  
      return ragResponse;
    } catch (error) {
      console.error("❌ RAG upload failed:", error);
      throw error;
    }
  };

  const sendQueryToRAG = async (query: string) => {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const RAG_BASE_URL = isDevelopment ?
        'http://localhost:8000' :
        process.env.NEXT_PUBLIC_RAG_API_URL;
  
      const sessionId = getSessionId();
  
      const response = await fetch(`${RAG_BASE_URL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include authentication if available
          ...(isAuthenticated ? getAuthHeaders() : {}),
          // Include session ID for proper isolation
          'X-Session-Id': sessionId,
        },
        body: JSON.stringify({ query }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Query failed (${response.status})`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
  
      return await response.json();
    } catch (error) {
      console.error("❌ RAG query failed:", error);
      throw error;
    }
  };
  
  // ADD: Function to check RAG status with session management
  const checkRAGStatus = async () => {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const RAG_BASE_URL = isDevelopment ?
        'http://localhost:8000' :
        process.env.NEXT_PUBLIC_RAG_API_URL;
  
      const sessionId = getSessionId();
  
      const response = await fetch(`${RAG_BASE_URL}/status`, {
        method: 'GET',
        headers: {
          // Include authentication if available
          ...(isAuthenticated ? getAuthHeaders() : {}),
          // Include session ID for proper isolation
          'X-Session-Id': sessionId,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Status check failed (${response.status})`);
      }
  
      return await response.json();
    } catch (error) {
      console.error("❌ RAG status check failed:", error);
      throw error;
    }
  };

  const resetRAGSession = async () => {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const RAG_BASE_URL = isDevelopment ?
        'http://localhost:8000' :
        process.env.NEXT_PUBLIC_RAG_API_URL;
  
      const sessionId = getSessionId();
  
      const response = await fetch(`${RAG_BASE_URL}/reset`, {
        method: 'DELETE',
        headers: {
          // Include authentication if available
          ...(isAuthenticated ? getAuthHeaders() : {}),
          // Include session ID for proper isolation
          'X-Session-Id': sessionId,
        },
      });
  
      if (response.ok) {
        console.log("✅ RAG session reset successfully");
        // Generate new session ID for fresh start
        localStorage.removeItem('rag_session_id');
        return true;
      } else {
        console.warn("⚠️ RAG session reset failed");
        return false;
      }
    } catch (error) {
      console.error("❌ RAG session reset error:", error);
      return false;
    }
  };
  
  // ADD: Function to clean up session on component unmount
  useEffect(() => {
    // Cleanup function when component unmounts
    return () => {
      // Optional: Clean up session if needed
      console.log("🧹 UploadComponent unmounting");
    };
  }, []);
  
  // ADD: Function to handle session conflicts
  const handleSessionConflict = async () => {
    console.log("🔄 Handling session conflict");
    
    // Clear current session
    localStorage.removeItem('rag_session_id');
    
    // Reset any existing state
    setFile(null);
    setUploadStatus("idle");
    setStatusMessage(null);
    setCurrentProgressStep(-1);
    setStepProgress(0);
    
    // Clear previous session if callback provided
    if (onClearPreviousSession) {
      onClearPreviousSession();
    }
    
    // Reset RAG backend session
    await resetRAGSession();
    
    toast.info("Session refreshed for better isolation");
  };
  
  // ADD: Function to validate file before upload
  const validateFileForUpload = (file: File): string | null => {
    const fileExt = file.name.toLowerCase().split(".").pop();
    const supportedExts = uploadOptions?.supported_file_types?.map((t) =>
      t.extension.replace(".", "")
    ) || ["pdf", "docx"];
  
    if (!supportedExts.includes(fileExt || "")) {
      const msg = `Unsupported file type. Supported: ${supportedExts
        .join(", ")
        .toUpperCase()}`;
      toast.error("Unsupported file type. Please select a valid PDF or DOCX file.");
      return msg;
    }
  
    const maxSizeMB = uploadOptions?.max_file_size_mb || 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File is too large. Maximum allowed is ${maxSizeMB}MB.`);
      return `File size too large. Maximum: ${maxSizeMB}MB`;
    }
  
    if (file.size === 0) {
      toast.error("File is empty. Please choose a non-empty file.");
      return "File is empty";
    }
  
    return null; // File is valid
  };

  
  const handleUpload = async () => {
    if (!file) {
      setUploadStatus("error");
      setStatusMessage("Please select a file first");
      return;
    }

    if (!userSettings) {
      setUploadStatus("error");
      setStatusMessage("User settings not loaded. Please try again.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("processing");
    setCurrentProgressStep(0);
    setStepProgress(0);
    setStatusMessage("Initializing ultra-fast processing...");

    // Animate initializing step
    const initializeStep = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setStepProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 50);
    };
    initializeStep();

    const startTime = Date.now();

    try {
      let documentInfo: any = null;
      let ragResponse: any = null;

      if (isAuthenticated && user) {
        console.log(
          "👤 Authenticated user - RAG-first workflow with ultra-fast processing"
        );

        try {
          // Step 1: Upload to ULTRA-FAST RAG system FIRST
          setTimeout(() => {
            setCurrentProgressStep(1);
            setStepProgress(0);
            setStatusMessage("Processing document...");
            
            const processStep = () => {
              let progress = 0;
              const interval = setInterval(() => {
                progress += 5;
                setStepProgress(progress);
                if (progress >= 100) {
                  clearInterval(interval);
                }
              }, 25);
            };
            processStep();
          }, 600);
          
          await new Promise(resolve => setTimeout(resolve, 600));
          ragResponse = await uploadToRagSystem(file);

          // Step 2: Save to database using the filename from RAG response
          setTimeout(() => {
            setCurrentProgressStep(2);
            setStepProgress(0);
            setStatusMessage("Preparing document...");
            
            const prepareStep = () => {
              let progress = 0;
              const interval = setInterval(() => {
                progress += 8;
                setStepProgress(progress);
                if (progress >= 100) {
                  clearInterval(interval);
                }
              }, 30);
            };
            prepareStep();
          }, 100);
          
          await new Promise(resolve => setTimeout(resolve, 500));
          documentInfo = await saveDocumentToDatabaseWithFilename(
            file,
            ragResponse.filename
          );

          // Clear old localStorage data for this user to prevent confusion
          const storageKey = `uploaded_documents_${user.id}`;
          const existingDocs = JSON.parse(
            localStorage.getItem(storageKey) || "[]"
          );

          const filteredDocs = existingDocs.filter(
            (doc: any) =>
              doc.fileName !== ragResponse.filename &&
              doc.originalFileName !== ragResponse.original_filename
          );

          localStorage.setItem(storageKey, JSON.stringify(filteredDocs));

          // Calculate and display performance
          const processingTime = (Date.now() - startTime) / 1000;
          const estimatedOldTime = 300;
          const speedup = estimatedOldTime / processingTime;

          let successMessage = `Document processed in ${processingTime.toFixed(
            1
          )}s (${speedup.toFixed(1)}x faster)!`;
          if (ragResponse?.conversion_performed) {
            successMessage += " (DOCX converted to PDF)";
          }
          if (ragResponse?.filename !== ragResponse?.original_filename) {
            successMessage += `\nRenamed: ${ragResponse.original_filename} → ${ragResponse.filename}`;
          }

          if (ragResponse?.security_status === "sanitized") {
            toast.warning(
              "Document content was sanitized for security reasons"
            );
            setStatusMessage(
              "Document processed (some content was sanitized for security)"
            );
          } else {
            setStatusMessage(successMessage);
            toast.success(
              `Ultra-fast processing complete! ${speedup.toFixed(1)}x faster`
            );
          }

          setUploadStatus("success");
        } catch (error) {
          console.error("RAG-first workflow failed:", error);

          if (isSecurityError(error)) {
            setUploadStatus("error");
            setStatusMessage(getSecurityErrorMessage(error));
            return;
          }

          // For non-security errors, try fallback to RAG only
          console.log("Trying RAG-only fallback after database error:", error);
          try {
            setTimeout(() => {
              setCurrentProgressStep(2);
              setStepProgress(0);
              setStatusMessage("Preparing the Document...");
              
              const prepareStep = () => {
                let progress = 0;
                const interval = setInterval(() => {
                  progress += 10;
                  setStepProgress(progress);
                  if (progress >= 100) {
                    clearInterval(interval);
                  }
                }, 40);
              };
              prepareStep();
            }, 100);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            ragResponse = await uploadToRagSystem(file);

            const processingTime = (Date.now() - startTime) / 1000;
            const speedup = 300 / processingTime;

            let fallbackMessage = `Document processed in ${processingTime.toFixed(
              1
            )}s (${speedup.toFixed(1)}x faster) for this session only`;
            if (ragResponse?.conversion_performed) {
              fallbackMessage += " (DOCX converted to PDF)";
            }

            if (ragResponse?.security_status === "sanitized") {
              toast.warning(
                "Document processed but content was sanitized for security"
              );
            } else {
              toast.warning(
                `Ultra-fast processing complete! Not saved to account.`
              );
            }

            setUploadStatus("success");
            setStatusMessage(fallbackMessage);
          } catch (fallbackError) {
            if (isSecurityError(fallbackError)) {
              setUploadStatus("error");
              setStatusMessage(getSecurityErrorMessage(fallbackError));
              return;
            }
            throw fallbackError;
          }
        }
      } else {
        // For non-authenticated users: Ultra-fast RAG system only
        console.log(
          "👥 Non-authenticated user - ultra-fast RAG processing only"
        );

        setTimeout(() => {
          setCurrentProgressStep(1);
          setStepProgress(0);
          setStatusMessage("Processing with ultra-fast AI system...");
          
          const processStep = () => {
            let progress = 0;
            const interval = setInterval(() => {
              progress += 6;
              setStepProgress(progress);
              if (progress >= 100) {
                clearInterval(interval);
              }
            }, 30);
          };
          processStep();
        }, 600);
        
        await new Promise(resolve => setTimeout(resolve, 600));
        ragResponse = await uploadToRagSystem(file);

        setTimeout(() => {
          setCurrentProgressStep(2);
          setStepProgress(0);
          
          const prepareStep = () => {
            let progress = 0;
            const interval = setInterval(() => {
              progress += 12;
              setStepProgress(progress);
              if (progress >= 100) {
                clearInterval(interval);
              }
            }, 25);
          };
          prepareStep();
        }, 100);

        await new Promise(resolve => setTimeout(resolve, 400));

        const processingTime = (Date.now() - startTime) / 1000;
        const speedup = 300 / processingTime;

        let sessionMessage = `Document processed in ${processingTime.toFixed(
          1
        )}s (${speedup.toFixed(1)}x faster) for this session only`;
        if (ragResponse?.conversion_performed) {
          sessionMessage += " (DOCX converted to PDF)";
        }

        if (ragResponse?.security_status === "sanitized") {
          toast.warning(
            "Document processed but some content was sanitized for security"
          );
          setStatusMessage(
            "Document processed for this session (content sanitized)"
          );
        } else {
          toast.success(
            `Ultra-fast processing complete! ${speedup.toFixed(1)}x faster`
          );
          setStatusMessage(sessionMessage);
        }

        setUploadStatus("success");
      }

      const uploadResponse: UploadResponse = {
        documentId: ragResponse?.document_id || Date.now().toString(),
        fileName: ragResponse?.filename || file.name,
        originalFileName: ragResponse?.original_filename || file.name,
        fileSize: file.size,
        uploadedAt: documentInfo?.uploadedAt || new Date().toISOString(),
        pageCount: ragResponse?.pages_processed || 1,
        status: documentInfo ? "TEMPORARY" : "TEMPORARY",
        securityStatus: ragResponse?.security_status || "verified",
        mimeType:
          ragResponse?.mime_type ||
          (file.name.toLowerCase().endsWith(".docx") ? "docx" : "pdf"),
        conversionPerformed: ragResponse?.conversion_performed || false,
      };

      const storageKey =
        isAuthenticated && user?.id
          ? `uploaded_documents_${user.id}`
          : "uploaded_documents";
      const existingDocs = JSON.parse(localStorage.getItem(storageKey) || "[]");

      const documentForStorage = {
        id: ragResponse?.document_id || Date.now().toString(),
        documentId: ragResponse?.document_id || Date.now().toString(),
        fileName: ragResponse?.filename || file.name,
        originalFileName: ragResponse?.original_filename || file.name,
        original_file_name: ragResponse?.original_filename || file.name,
        fileSize: uploadResponse.fileSize,
        file_size: uploadResponse.fileSize,
        pageCount: ragResponse?.pages_processed || 1,
        page_count: ragResponse?.pages_processed || 1,
        status: uploadResponse.status,
        uploadedAt: uploadResponse.uploadedAt,
        uploaded_at: uploadResponse.uploadedAt,
        databaseId: documentInfo?.documentId || documentInfo?.id,
        processingTime: ragResponse?.processing_time,
        optimizationUsed: ragResponse?.optimization_used,
        mimeType: uploadResponse.mimeType,
        securityStatus: uploadResponse.securityStatus,
        conversionPerformed: uploadResponse.conversionPerformed,
        uploadSequence: Date.now(),
      };

      existingDocs.unshift(documentForStorage);
      const recentDocs = existingDocs.slice(0, 5);
      localStorage.setItem(storageKey, JSON.stringify(recentDocs));

      onUploadSuccess(uploadResponse);

      // Reset form
      setFile(null);
      setCurrentProgressStep(-1);
      setStepProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("❌ Upload failed completely:", error);

      if (isSecurityError(error)) {
        setUploadStatus("error");
        setStatusMessage(getSecurityErrorMessage(error));
        toast.error(getSecurityErrorMessage(error));
      } else {
        let errorMessage = handleApiError(error);
        if (errorMessage.includes("conversion")) {
          errorMessage =
            "DOCX conversion failed. Please try a different file or convert manually to PDF.";
        } else if (errorMessage.includes("extractable text")) {
          errorMessage =
            "Document does not contain extractable text. Please ensure it's not a scanned document.";
        }

        setUploadStatus("error");
        setStatusMessage(errorMessage);
        toast.error("Upload failed: " + errorMessage);
      }
    } finally {
      setIsUploading(false);
      setCurrentProgressStep(-1);
      setStepProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fileExt = droppedFile.name.toLowerCase().split(".").pop();
      const supportedExts = uploadOptions?.supported_file_types?.map((t) =>
        t.extension.replace(".", "")
      ) || ["pdf", "docx"];

      if (supportedExts.includes(fileExt || "")) {
        setFile(droppedFile);
        setUploadStatus("idle");
        setStatusMessage(null);
        setCurrentProgressStep(-1);
        setStepProgress(0);
      } else {
        setUploadStatus("error");
        setStatusMessage(
          `Please drop a valid file. Supported: ${supportedExts
            .join(", ")
            .toUpperCase()}`
        );
        toast.error("Invalid file. Only PDF and DOCX are supported.");
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <BlurText
          text="To get started, upload a PDF or DOCX document"
          className="font-serif text-2xl font-bold text-foreground"
          delay={50}
        />
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          uploadStatus === "error"
            ? "border-destructive/20 bg-destructive/10"
            : uploadStatus === "success"
            ? "border-blue-500 bg-blue/20 hover:border-blue-500 hover:bg-blue/30"
            : "border-tertiary bg-tertiary hover:border-tertiary hover:bg-accent"
        }`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          {file ? (
            <FileText className="w-12 h-12 text-blue-600 mb-3" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400 mb-3" />
          )}

          <h3 className="text-lg font-medium text-foreground mb-2">
            {file ? file.name : "Upload PDF or DOCX Document"}
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            {file
              ? `${(file.size / 1024 / 1024).toFixed(
                  2
                )} MB • Ready for processing`
              : "Drag and drop your document here, or click to browse"}
          </p>

          <p className="text-xs text-muted-foreground">
            Supported: PDF, DOCX • Maximum file size:{" "}
            {uploadOptions?.max_file_size_mb || 50}MB
          </p>
        </div>
      </div>

      {/* Upload Button */}
      {file && (
        <button
          onClick={handleUpload}
          disabled={!file || isUploading || loadingSettings}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            !file || isUploading || loadingSettings
              ? "bg-tertiary text-muted-foreground cursor-not-allowed hidden"
              : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          }`}
        >
          {isUploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {uploadStatus === "processing"
                ? statusMessage
                : "Processing document..."}
            </div>
          ) : loadingSettings ? (
            "Loading settings..."
          ) : (
            "Upload File"
          )}
        </button>
      )}

      {/* Progress Bar - Only show when uploading */}
      {isUploading && currentProgressStep >= 0 && (
        <div className="mt-3">
          <ProgressSteps 
            currentStep={currentProgressStep} 
            steps={progressSteps} 
            stepProgress={stepProgress}
          />
        </div>
      )}

      {/* Session Mode Notice */}
      <div className="mt-2 p-4 flex gap-4 items-center bg-tertiary border-dashed border-2 border-tertiary rounded-md text-foreground text-sm">
        <MessageSquareDashed className="w-10 h-10 mt-0.5 flex-shrink-0" />
        <span className="flex flex-col">
          <p className="font-medium">Temporary Session Mode</p>
          <p>
            Documents are processed for this session only unless you save them
            permanently.
          </p>
        </span>
      </div>

    </div>
  );
}

export default UploadComponent;