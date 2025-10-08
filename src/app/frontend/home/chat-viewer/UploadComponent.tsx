// Fixed version of the UploadComponent with proper state management
import { Upload, FileText, MessageSquareDashed, X, Paperclip, LucideCircleDashed, LucideMessageCircleDashed, LucideCircleDotDashed } from "lucide-react";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { UploadResponse } from "../../../../lib/api";
import { useAuth } from "@/lib/context/AuthContext";
import { toast, Toaster } from "sonner";
import { authUtils } from "@/lib/auth";
import BlurText from "../../components/reactbits/BlurText";
import { getSecurityErrorMessage, isSecurityError } from "../../../../lib/api";
import { GoSquareFill } from "react-icons/go";
import { TbCircleDashedLetterT } from "react-icons/tb";
import { PiTriangleDashedFill } from "react-icons/pi";

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
  file_naming_format: "ORIGINAL" | "ADD_TIMESTAMP" | "ADD_CLIENT_NAME";
  title?: string;
  client_name?: string;
}

// Progress Bar Component
interface ProgressStepProps {
  currentStep: number;
  steps: string[];
  stepProgress: number; // 0-100 for current step
  elapsedTime?: number; // Optional elapsed time in seconds
  isUploading?: boolean; // Whether upload is in progress
  isStopping?: boolean; // Whether stop is in progress
  stopUpload?: () => void; // Stop function
}

// Helper function to format elapsed time
const formatElapsedTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

const ProgressSteps: React.FC<ProgressStepProps> = ({
  currentStep,
  steps,
  stepProgress,
  elapsedTime,
  isUploading,
  isStopping,
  stopUpload,
}) => {
  const getStepColor = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return "bg-blue-600"; // Initializing - Blue
      case 1:
        return "bg-purple-600"; // Processing - Purple
      case 2:
        return "bg-yellow-500"; // Preparing - Yellow
      default:
        return "bg-blue-600";
    }
  };

  const getTextColor = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return "text-blue-600"; // Initializing - Blue
      case 1:
        return "text-purple-600"; // Processing - Purple
      case 2:
        return "text-yellow-600"; // Preparing - Yellow
      default:
        return "text-blue-600";
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Progress Bar */}
      <div className="w-full bg-tertiary rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${getStepColor(
            currentStep
          )}`}
          style={{
            width: `${stepProgress}%`,
          }}
        />
      </div>

      {/* Step Labels and Elapsed Time */}
      <div className="flex justify-between items-center text-xs">
        <div className="flex justify-between flex-1">
          {steps.map((step, index) => (
            <span
              key={index}
              className={`transition-colors duration-300 ${
                index === currentStep
                  ? `${getTextColor(index)} font-medium`
                  : index < currentStep
                  ? "text-muted-foreground opacity-20 font-medium"
                  : "text-muted-foreground opacity-20"
              }`}
            >
              {step}
            </span>
          ))}
        </div>
      </div>
      <div></div>

      <div className="flex justify-between">
        {/* Elapsed Time Display */}
        {elapsedTime !== undefined && elapsedTime > 0 && (
          <div className="text-muted-foreground font-mono text-xs bg-tertiary py-1 rounded">
            Time elapsed: {formatElapsedTime(elapsedTime)}
          </div>
        )}

        {isUploading && (
          <button
            className={`font-mono text-xs p-1 rounded-full transition-colors ${
              isStopping
                ? "bg-primary text-foreground cursor-not-allowed"
                : "bg-foreground text-primary hover:bg-red-600 cursor-pointer"
            }`}
            onClick={isStopping ? undefined : stopUpload}
            disabled={isStopping}
            type="button"
          >
            <GoSquareFill className="w-5 h-5" />
          </button>
        )}
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

  // Time elapsed tracking
  const [elapsedTime, setElapsedTime] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);

  // Upload cancellation
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  const [showNotice, setShowNotice] = useState(true);

  // Real-time elapsed time counter
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (uploadStartTime && isUploading) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = (now - uploadStartTime) / 1000; // Convert to seconds
        setElapsedTime(elapsed);
      }, 100); // Update every 100ms for smooth display
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [uploadStartTime, isUploading]);

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
      // Reset all states when new file is selected
      setUploadStatus("idle");
      setStatusMessage(null);
      setWarning(null);
      setCurrentProgressStep(-1);
      setStepProgress(0);
      setUploadStartTime(null);
      setElapsedTime(0);

      const fileExt = selectedFile.name.toLowerCase().split(".").pop();
      const supportedExts = uploadOptions?.supported_file_types?.map((t) =>
        t.extension.replace(".", "")
      ) || ["pdf", "docx"];

      if (supportedExts.includes(fileExt || "")) {
        const maxSizeMB = uploadOptions?.max_file_size_mb || 50;
        if (selectedFile.size > maxSizeMB * 1024 * 1024) {
          setFile(null);
          setUploadStatus("error");
          setStatusMessage(
            `File is too large. Maximum allowed size is ${maxSizeMB}MB. Please choose a smaller file.`
          );
          toast.error(
            `File is too large. Maximum allowed size is ${maxSizeMB}MB.`
          );
          return;
        }

        if (selectedFile.size === 0) {
          setFile(null);
          setUploadStatus("error");
          setStatusMessage("File is empty. Please choose a non-empty file.");
          toast.error("File is empty. Please choose a non-empty file.");
          return;
        }

        // File is valid
        setFile(selectedFile);
      } else {
        setFile(null);
        setUploadStatus("error");
        setStatusMessage(
          `Unsupported file type. Supported formats: ${supportedExts
            .join(", ")
            .toUpperCase()}. Please choose a valid PDF or DOCX file.`
        );
        toast.error(
          "Unsupported file type. Please select a valid PDF or DOCX file."
        );
      }
    }
  };

  const saveDocumentToDatabaseWithFilename = async (
    file: File,
    ragFilename: string,
    signal?: AbortSignal
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
        signal, // Add abort signal
      });

      if (response.ok) {
        const savedDocument = await response.json();
        console.log(
          "✅ Document saved to database with RAG filename:",
          savedDocument
        );
        return savedDocument;
      } else {
        let errorMessage = `Database save failed: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error ||
            errorData.message ||
            errorData.detail ||
            errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, provide meaningful error based on status
          if (response.status === 413) {
            errorMessage = "File is too large to save to database";
          } else if (response.status === 415) {
            errorMessage = "File type not supported for database storage";
          } else if (response.status === 500) {
            errorMessage = "Database server error occurred";
          } else if (response.status === 401) {
            errorMessage = "Authentication required to save file";
          } else if (response.status === 403) {
            errorMessage = "You don't have permission to save this file";
          }
        }

        console.error("❌ Database save failed:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("❌ Database save error:", error);
      throw error;
    }
  };

  const updateDocumentFilenameAfterRag = async (
    documentId: string,
    ragFilename: string,
    signal?: AbortSignal
  ): Promise<any> => {
    if (!isAuthenticated || !user) {
      console.log("👤 User not authenticated, skipping filename update");
      return null;
    }

    try {
      console.log("🔄 Updating document filename after RAG processing:", {
        documentId,
        ragFilename,
      });

      const response = await fetch(
        `/backend/api/documents/${documentId}/rename`,
        {
          method: "PATCH",
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newName: ragFilename,
            updateProcessedName: true, // Flag to indicate this is from RAG processing
          }),
          signal, // Add abort signal
        }
      );

      if (response.ok) {
        const updatedDocument = await response.json();
        console.log(
          "✅ Document filename updated after RAG processing:",
          updatedDocument
        );
        return updatedDocument;
      } else {
        const errorData = await response.json();
        console.error("❌ Document filename update failed:", errorData);
        // Don't throw error - this is not critical for the upload flow
        return null;
      }
    } catch (error) {
      console.error("❌ Document filename update error:", error);
      // Don't throw error - this is not critical for the upload flow
      return null;
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
          "X-Session-Id": sessionId,
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
    let sessionId = localStorage.getItem("rag_session_id");
    if (!sessionId) {
      // Generate a unique session ID
      sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      localStorage.setItem("rag_session_id", sessionId);
    }
    return sessionId;
  };

  const uploadToRagSystemWithId = async (
    file: File,
    documentId: string,
    signal?: AbortSignal
  ): Promise<any> => {
    try {
      console.log(
        `🚀 Uploading to RAG system with database ID: ${documentId}...`
      );

      // [Unverified] Move the session clearing to be asynchronous to prevent setState during render
      if (onClearPreviousSession) {
        console.log("🧹 Clearing previous frontend session state");
        // Use setTimeout to prevent setState during render
        setTimeout(() => onClearPreviousSession(), 0);
      }

      const isDevelopment = process.env.NODE_ENV === "development";
      // Use the same URL consistently - MODIFY: Update to use correct port
      const RAG_BASE_URL = isDevelopment
        ? "http://localhost:8000" // Updated to match Railway backend port
        : process.env.NEXT_PUBLIC_RAG_API_URL;

      console.log("🔗 Using RAG URL:", RAG_BASE_URL);

      // Convert enum to string format expected by backend
      const getNamingOption = (format: string) => {
        switch (format) {
          case "ORIGINAL":
            return "keep_original";
          case "ADD_TIMESTAMP":
            return "add_timestamp";
          case "ADD_CLIENT_NAME":
            return "add_client_name";
          default:
            return "keep_original";
        }
      };

      // Prepare form data with user settings and database ID
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_id", documentId); // 🔥 Pass database cuid ID
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
      const sessionId =
        typeof window !== "undefined"
          ? localStorage.getItem("rag_session_id") || `sess_${Date.now()}`
          : `sess_${Date.now()}`;

      if (
        typeof window !== "undefined" &&
        !localStorage.getItem("rag_session_id")
      ) {
        localStorage.setItem("rag_session_id", sessionId);
      }

      const response = await fetch(`${RAG_BASE_URL}/upload-pdf-ultra-fast`, {
        method: "POST",
        headers: {
          // Don't set Content-Type - let browser set it with boundary for FormData
          Authorization: `Bearer ${authUtils.getToken()}`,
          "X-Session-Id": sessionId,
        },
        body: formData,
        signal, // Add abort signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ RAG upload failed:", errorText);

        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorText;
        } catch (parseError) {
          // If we can't parse JSON, use the raw text or create a meaningful message
          if (errorText.includes("413")) {
            errorMessage = "File is too large for upload";
          } else if (errorText.includes("415")) {
            errorMessage = "Unsupported file type";
          } else if (errorText.includes("500")) {
            errorMessage = "Server error occurred during processing";
          } else if (errorText.includes("timeout")) {
            errorMessage = "Upload timed out - please try again";
          } else if (errorText.trim()) {
            errorMessage = errorText;
          }
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ RAG system upload successful:", result);
      return result;
    } catch (error) {
      console.error("❌ RAG system upload error:", error);
      throw error;
    }
  };

  const uploadToRagSystem = async (
    file: File,
    signal?: AbortSignal
  ): Promise<any> => {
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
        ? "http://localhost:8000" // Updated to match Railway backend port
        : process.env.NEXT_PUBLIC_RAG_API_URL;

      console.log("🔗 Using RAG URL:", RAG_BASE_URL);

      // Convert enum to string format expected by backend
      const getNamingOption = (format: string) => {
        switch (format) {
          case "ORIGINAL":
            return "keep_original";
          case "ADD_TIMESTAMP":
            return "add_timestamp";
          case "ADD_CLIENT_NAME":
            return "add_client_name";
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
          "X-Session-Id": sessionId,
        },
        signal, // Add abort signal
      });

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON response, provide meaningful error based on status
          if (response.status === 413) {
            errorMessage = "File is too large for upload";
          } else if (response.status === 415) {
            errorMessage = "Unsupported file type";
          } else if (response.status === 500) {
            errorMessage = "Server error occurred during processing";
          } else if (response.status === 408) {
            errorMessage = "Upload timed out - please try again";
          }
        }

        throw new Error(errorMessage);
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
      const isDevelopment = process.env.NODE_ENV === "development";
      const RAG_BASE_URL = isDevelopment
        ? "http://localhost:8000"
        : process.env.NEXT_PUBLIC_RAG_API_URL;

      const sessionId = getSessionId();

      const response = await fetch(`${RAG_BASE_URL}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Include authentication if available
          ...(isAuthenticated ? getAuthHeaders() : {}),
          // Include session ID for proper isolation
          "X-Session-Id": sessionId,
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
      const isDevelopment = process.env.NODE_ENV === "development";
      const RAG_BASE_URL = isDevelopment
        ? "http://localhost:8000"
        : process.env.NEXT_PUBLIC_RAG_API_URL;

      const sessionId = getSessionId();

      const response = await fetch(`${RAG_BASE_URL}/status`, {
        method: "GET",
        headers: {
          // Include authentication if available
          ...(isAuthenticated ? getAuthHeaders() : {}),
          // Include session ID for proper isolation
          "X-Session-Id": sessionId,
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
      const isDevelopment = process.env.NODE_ENV === "development";
      const RAG_BASE_URL = isDevelopment
        ? "http://localhost:8000"
        : process.env.NEXT_PUBLIC_RAG_API_URL;

      const sessionId = getSessionId();

      const response = await fetch(`${RAG_BASE_URL}/reset`, {
        method: "DELETE",
        headers: {
          // Include authentication if available
          ...(isAuthenticated ? getAuthHeaders() : {}),
          // Include session ID for proper isolation
          "X-Session-Id": sessionId,
        },
      });

      if (response.ok) {
        console.log("✅ RAG session reset successfully");
        // Generate new session ID for fresh start
        localStorage.removeItem("rag_session_id");
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
    localStorage.removeItem("rag_session_id");

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

  // Stop upload function
  const stopUpload = useCallback(async () => {
    if (!isUploading) return;

    console.log("🛑 Stopping upload process...");
    setIsStopping(true);

    try {
      // Abort any ongoing fetch requests
      if (abortController) {
        abortController.abort();
        console.log("✅ Fetch requests aborted");
      }

      // Reset upload state
      setIsUploading(false);
      setUploadStatus("idle");
      setCurrentProgressStep(-1);
      setStepProgress(0);
      setUploadStartTime(null);
      setElapsedTime(0);
      setStatusMessage("Upload cancelled");

      // Clear file selection
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Reset RAG session to clean up any partial processing
      try {
        await resetRAGSession();
        console.log("✅ RAG session reset after cancellation");
      } catch (error) {
        console.warn("⚠️ Failed to reset RAG session:", error);
      }

      // Clear previous session if callback provided
      if (onClearPreviousSession) {
        setTimeout(() => onClearPreviousSession(), 0);
      }
    } catch (error) {
      console.error("❌ Error during upload cancellation:", error);
      toast.error("Error cancelling upload");
    } finally {
      setIsStopping(false);
      setAbortController(null);
    }
  }, [isUploading, abortController, onClearPreviousSession]);

  // Make stopUpload available globally for the button
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).stopUpload = stopUpload;
    }

    return () => {
      if (typeof window !== "undefined") {
        delete (window as any).stopUpload;
      }
    };
  }, [stopUpload]);

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
      toast.error(
        "Unsupported file type. Please select a valid PDF or DOCX file."
      );
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
    setIsStopping(false);

    // Create abort controller for cancellation
    const controller = new AbortController();
    setAbortController(controller);

    // Start the elapsed time counter
    const uploadStart = Date.now();
    setUploadStartTime(uploadStart);
    setElapsedTime(0);

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
          // Step 1: Save to database FIRST to get cuid ID
          setTimeout(() => {
            setCurrentProgressStep(1);
            setStepProgress(0);
            setStatusMessage("Saving document...");

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

          await new Promise((resolve) => setTimeout(resolve, 600));
          // Save to database with RAG-generated intelligent filename
          documentInfo = await saveDocumentToDatabaseWithFilename(
            file,
            ragResponse?.filename || file.name,
            controller.signal
          );

          // Step 2: Upload to RAG system using the database cuid ID
          setTimeout(() => {
            setCurrentProgressStep(2);
            setStepProgress(0);
            setStatusMessage("Processing with AI...");

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

          await new Promise((resolve) => setTimeout(resolve, 500));
          // Upload to RAG system with database ID
          ragResponse = await uploadToRagSystemWithId(
            file,
            documentInfo.documentId || documentInfo.id,
            controller.signal
          );

          // Step 3: Update database with RAG-processed filename if it changed
          if (ragResponse?.filename && ragResponse.filename !== file.name) {
            console.log("🔄 RAG system renamed file, updating database:", {
              original: file.name,
              ragProcessed: ragResponse.filename,
            });

            try {
              await updateDocumentFilenameAfterRag(
                documentInfo.documentId || documentInfo.id,
                ragResponse.filename,
                controller.signal
              );
            } catch (updateError) {
              console.warn(
                "⚠️ Failed to update filename in database (non-critical):",
                updateError
              );
            }
          }

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

          // ✅ CRITICAL FIX: Delete the document from database if it was saved but RAG processing failed
          if (documentInfo?.documentId || documentInfo?.id) {
            const docIdToDelete = documentInfo.documentId || documentInfo.id;
            console.log(
              `🗑️ Deleting failed document ${docIdToDelete} from database...`
            );

            try {
              await fetch(`/backend/api/documents/${docIdToDelete}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
              });
              console.log(
                `✅ Successfully deleted failed document ${docIdToDelete} from database`
              );
            } catch (deleteError) {
              console.error(
                `❌ Failed to delete document ${docIdToDelete} from database:`,
                deleteError
              );
            }

            // Reset documentInfo so it won't be used later
            documentInfo = null;
          }

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

            await new Promise((resolve) => setTimeout(resolve, 500));
            ragResponse = await uploadToRagSystem(file, controller.signal);

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

        await new Promise((resolve) => setTimeout(resolve, 600));
        ragResponse = await uploadToRagSystem(file, controller.signal);

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

        await new Promise((resolve) => setTimeout(resolve, 400));

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

      // ✅ CRITICAL FIX: Only proceed with success handling if we have valid response data
      if (!ragResponse || !ragResponse.document_id) {
        throw new Error(
          "Upload completed but did not receive valid document information"
        );
      }

      const uploadResponse: UploadResponse = {
        // 🔥 FIXED: Use database cuid ID if available, otherwise use RAG document_id as fallback
        documentId:
          documentInfo?.documentId ||
          documentInfo?.id ||
          ragResponse?.document_id,
        fileName: ragResponse?.filename || file.name, // RAG-generated intelligent filename
        originalFileName: file.name, // ✅ FIXED: Always use the actual original file name from user
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
        // 🔥 FIXED: Use database cuid ID if available, otherwise use RAG document_id as fallback
        id:
          documentInfo?.documentId ||
          documentInfo?.id ||
          ragResponse?.document_id,
        documentId:
          documentInfo?.documentId ||
          documentInfo?.id ||
          ragResponse?.document_id,
        fileName: ragResponse?.filename || file.name, // RAG-generated intelligent filename
        originalFileName: file.name, // ✅ FIXED: Always use the actual original file name from user
        original_file_name: file.name, // ✅ FIXED: Always use the actual original file name from user
        fileSize: uploadResponse.fileSize,
        file_size: uploadResponse.fileSize,
        pageCount: ragResponse?.pages_processed || 1,
        page_count: ragResponse?.pages_processed || 1,
        status: uploadResponse.status,
        uploadedAt: uploadResponse.uploadedAt,
        uploaded_at: uploadResponse.uploadedAt,
        databaseId:
          documentInfo?.documentId ||
          documentInfo?.id ||
          ragResponse?.document_id,
        // No more separate RAG ID - everything uses database ID
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

      // Check if the error is due to abort (user cancelled)
      if (error instanceof Error && error.name === "AbortError") {
        console.log("🛑 Upload was cancelled by user");
        setUploadStatus("idle");
        setStatusMessage("Upload cancelled");
        toast.info("Upload cancelled");
        return; // Don't show error for user cancellation
      }

      // Enhanced error handling with specific error types
      let errorMessage = "Upload failed";
      let userFriendlyMessage = "An unexpected error occurred during upload";

      if (isSecurityError(error)) {
        const securityMessage = getSecurityErrorMessage(error);
        setUploadStatus("error");
        setStatusMessage(securityMessage);
        toast.error(securityMessage);
        return;
      }

      // Handle different error types
      if (error instanceof Error) {
        const errorText = error.message.toLowerCase();

        if (errorText.includes("network") || errorText.includes("fetch")) {
          userFriendlyMessage =
            "Network error. Please check your internet connection and try again.";
        } else if (errorText.includes("timeout")) {
          userFriendlyMessage =
            "Upload timed out. Please try again with a smaller file or check your connection.";
        } else if (
          errorText.includes("file too large") ||
          errorText.includes("size")
        ) {
          userFriendlyMessage = `File is too large. Maximum allowed size is ${
            uploadOptions?.max_file_size_mb || 50
          }MB.`;
        } else if (
          errorText.includes("unsupported") ||
          errorText.includes("invalid")
        ) {
          userFriendlyMessage =
            "Unsupported file type. Please upload a PDF or DOCX file.";
        } else if (errorText.includes("conversion")) {
          userFriendlyMessage =
            "DOCX conversion failed. Please try converting the file to PDF manually.";
        } else if (
          errorText.includes("extractable text") ||
          errorText.includes("text extraction")
        ) {
          userFriendlyMessage =
            "Document does not contain extractable text. Please ensure it's not a scanned document.";
        } else if (
          errorText.includes("corrupted") ||
          errorText.includes("damaged")
        ) {
          userFriendlyMessage =
            "File appears to be corrupted or damaged. Please try a different file.";
        } else if (errorText.includes("server") || errorText.includes("500")) {
          userFriendlyMessage =
            "Server error occurred. Please try again in a few moments.";
        } else if (
          errorText.includes("unauthorized") ||
          errorText.includes("401")
        ) {
          userFriendlyMessage = "Authentication failed. Please sign in again.";
        } else if (
          errorText.includes("forbidden") ||
          errorText.includes("403")
        ) {
          userFriendlyMessage =
            "You don't have permission to upload this file.";
        } else if (
          errorText.includes("not found") ||
          errorText.includes("404")
        ) {
          userFriendlyMessage =
            "Upload service not found. Please contact support.";
        } else if (
          errorText.includes("invalid argument") ||
          errorText.includes("errno 22")
        ) {
          userFriendlyMessage =
            "Invalid file name. Please rename your file to remove special characters and try again.";
        } else if (error.message && error.message.length > 0) {
          // Use the original error message if it's descriptive
          userFriendlyMessage = error.message;
        }

        errorMessage = error.message;
      } else {
        // Handle non-Error objects
        const errorStr = String(error);
        if (errorStr.includes("Failed to fetch")) {
          userFriendlyMessage =
            "Unable to connect to server. Please check your internet connection.";
        }
        errorMessage = errorStr;
      }

      console.error("📋 Error details:", {
        originalError: error,
        errorMessage,
        userFriendlyMessage,
      });

      setUploadStatus("error");
      setStatusMessage(userFriendlyMessage);
      toast.error(userFriendlyMessage);
    } finally {
      setIsUploading(false);
      setCurrentProgressStep(-1);
      setStepProgress(0);
      setUploadStartTime(null); // Reset the timer
      setAbortController(null); // Clean up abort controller
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Reset states
      setUploadStatus("idle");
      setStatusMessage(null);
      setCurrentProgressStep(-1);
      setStepProgress(0);
      setUploadStartTime(null);
      setElapsedTime(0);

      const fileExt = droppedFile.name.toLowerCase().split(".").pop();
      const supportedExts = uploadOptions?.supported_file_types?.map((t) =>
        t.extension.replace(".", "")
      ) || ["pdf", "docx"];

      if (supportedExts.includes(fileExt || "")) {
        const maxSizeMB = uploadOptions?.max_file_size_mb || 50;
        if (droppedFile.size > maxSizeMB * 1024 * 1024) {
          setFile(null);
          setUploadStatus("error");
          setStatusMessage(
            `File is too large. Maximum allowed size is ${maxSizeMB}MB. Please choose a smaller file.`
          );
          toast.error(
            `File is too large. Maximum allowed size is ${maxSizeMB}MB.`
          );
          return;
        }

        if (droppedFile.size === 0) {
          setFile(null);
          setUploadStatus("error");
          setStatusMessage("File is empty. Please choose a non-empty file.");
          toast.error("File is empty. Please choose a non-empty file.");
          return;
        }

        // File is valid
        setFile(droppedFile);
      } else {
        setFile(null);
        setUploadStatus("error");
        setStatusMessage(
          `Unsupported file type. Supported formats: ${supportedExts
            .join(", ")
            .toUpperCase()}. Please drop a valid PDF or DOCX file.`
        );
        toast.error("Invalid file. Only PDF and DOCX are supported.");
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const dismissNotice = () => {
    setShowNotice(false);
  };

  return (
    <div className="space-y-6 mx-2 md:mx-0">
      <div>
        <BlurText
          text="To get started, upload a PDF or DOCX document"
          className="font-serif text-2xl font-bold text-foreground"
          delay={50}
        />
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center transition-colors cursor-pointer ${
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
            <Paperclip className="w-12 h-12 text-yellow-600 mb-3" />
          ) : (
            <Upload className="w-12 h-12 text-foreground mb-3" />
          )}

          <h3 className="text-lg font-medium text-foreground mb-1">
            {file ? file.name : "Upload Document"}
          </h3>

          <p className="text-sm text-muted-foreground">
            {file
              ? `${(file.size / 1024 / 1024).toFixed(
                  2
                )} MB • Ready for processing`
              : ""}
          </p>

          <p className="text-xs text-muted-foreground">
            Maximum file size: {uploadOptions?.max_file_size_mb || 50}MB
          </p>
        </div>
      </div>
      {/* Error State with Retry Button */}
      {file && uploadStatus === "error" && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={isUploading || loadingSettings}
              className="flex-1 py-3 px-4 rounded-md font-medium bg-yellow-muted text-white hover:brightness-105 cursor-pointer transition-colors disabled:bg-tertiary disabled:text-muted-foreground disabled:cursor-not-allowed"
            >
              {isUploading ? "Retrying..." : "Try Again"}
            </button>
            <button
              onClick={() => {
                setFile(null);
                setUploadStatus("idle");
                setStatusMessage(null);
                setCurrentProgressStep(-1);
                setStepProgress(0);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="px-4 py-3 rounded-md font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer transition-colors"
            >
              Choose Different File
            </button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      {file && uploadStatus !== "error" && (
        <button
          onClick={handleUpload}
          disabled={!file || isUploading || loadingSettings}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            !file || isUploading || loadingSettings
              ? "bg-tertiary text-muted-foreground cursor-not-allowed hidden"
              : "bg-yellow-muted text-white hover:brightness-105 cursor-pointer"
          }`}
        >
          Upload File
        </button>
      )}

      {/* Progress Bar - Only show when uploading */}
      {isUploading && currentProgressStep >= 0 && (
        <div className="mt-3">
          <ProgressSteps
            currentStep={currentProgressStep}
            steps={progressSteps}
            stepProgress={stepProgress}
            elapsedTime={elapsedTime}
            isUploading={isUploading}
            isStopping={isStopping}
            stopUpload={stopUpload}
          />
        </div>
      )}

      {/* Session Mode Notice */}
      {showNotice && (
         <div className="mt-6 flex bg-blue/10 items-center gap-3 p-3 px-4 rounded-lg">
         <LucideCircleDotDashed   className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
         <p className="text-sm text-blue-600">
           Documents are stored temporarily for this session only unless you save them.
         </p>
         </div>
      )}

      <Toaster />
    </div>
  );
}

export default UploadComponent;
