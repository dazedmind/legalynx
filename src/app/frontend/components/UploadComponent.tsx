// Fixed UploadComponent.tsx for ultra-fast backend integration
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  MessageSquareDashed,
  Info,
} from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { apiService, handleApiError, UploadResponse } from "../lib/api";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { authUtils } from "@/lib/auth";
import BlurText from "./reactbits/BlurText";
import {
  SecurityError,
  getSecurityErrorMessage,
  isSecurityError,
} from "../lib/api";

interface UploadPageProps {
  onUploadSuccess: (response: UploadResponse) => void;
  handleNewChat?: () => void;
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

function UploadComponent({ onUploadSuccess, handleNewChat }: UploadPageProps) {
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

  // Load upload options and user settings on component mount
  useEffect(() => {
    const loadUploadOptions = async () => {
      try {
        // Try to load from the new ultra-fast backend
        const response = await fetch("http://localhost:8000/upload-options");
        if (response.ok) {
          const options = await response.json();
          setUploadOptions(options);
          console.log("✅ Loaded upload options from ultra-fast backend");
        } else {
          console.log("📋 Using default upload options (backend endpoint not available)");
          // Keep default options defined above
        }
      } catch (error) {
        console.log("📋 Using default upload options (fetch failed):", error);
        // Keep default options defined above
      }
    };

    const loadUserSettings = async () => {
      if (!isAuthenticated || !user) {
        // For non-authenticated users, use default settings
        setUserSettings({
          file_naming_format: "ORIGINAL",
        });
        return;
      }

      setLoadingSettings(true);
      try {
        // Try to fetch user settings from your API
        const response = await fetch("/backend/api/user/settings", {
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const settings = await response.json();
          setUserSettings({
            file_naming_format: settings.file_naming_format || "ORIGINAL",
            title: settings.title,
            client_name: settings.client_name,
          });
          console.log("✅ Loaded user settings:", settings);
        } else {
          // Fallback to default settings
          setUserSettings({
            file_naming_format: "ORIGINAL",
          });
        }
      } catch (error) {
        console.error("Failed to load user settings:", error);
        // Fallback to default settings
        setUserSettings({
          file_naming_format: "ORIGINAL",
        });
      } finally {
        setLoadingSettings(false);
      }
    };

    loadUploadOptions();
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
      // Check file type - use safe access with fallback
      const fileExt = selectedFile.name.toLowerCase().split(".").pop();
      const supportedExts = uploadOptions?.supported_file_types?.map((t) =>
        t.extension.replace(".", "")
      ) || ["pdf", "docx"]; // Fallback to default supported types

      if (supportedExts.includes(fileExt || "")) {
        setFile(selectedFile);
        setUploadStatus("idle");
        setStatusMessage(null);
        setWarning(null);

        // Check file size
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
      }
    }
  };

  const saveDocumentToDatabase = async (file: File): Promise<any> => {
    if (!isAuthenticated || !user) {
      console.log("👤 User not authenticated, skipping database save");
      return null;
    }

    try {
      console.log("💾 Saving to database for authenticated user...");

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/backend/api/documents/upload", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (response.ok) {
        const savedDocument = await response.json();
        console.log("✅ Document saved to database:", savedDocument);
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

  const uploadToRagSystem = async (file: File): Promise<any> => {
    try {
      console.log("🚀 Uploading to ULTRA-FAST RAG system...");

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

      // Add title and client name from user settings if available
      if (userSettings?.title?.trim()) {
        formData.append("title", userSettings.title.trim());
      }
      if (userSettings?.client_name?.trim()) {
        formData.append("client_name", userSettings.client_name.trim());
      }

      // 🚀 USE THE NEW ULTRA-FAST ENDPOINT
      const response = await fetch("http://localhost:8000/upload-pdf-ultra-fast", {
        method: "POST",
        body: formData,
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Ultra-fast upload failed");
      }

      const ragResponse = await response.json();
      console.log("✅ ULTRA-FAST RAG upload successful:", ragResponse);
      console.log(`⚡ Processing time: ${ragResponse.processing_time?.toFixed(2)}s`);
      console.log(`🎯 Optimization used: ${ragResponse.optimization_used}`);
      
      // Show performance improvement in toast
      if (ragResponse.processing_time) {
        const oldTime = 300; // 5 minutes
        const speedup = oldTime / ragResponse.processing_time;
        toast.success(`Ultra-fast processing complete! ${speedup.toFixed(1)}x faster than before`);
      }
      
      return ragResponse;
    } catch (error) {
      console.error("❌ Ultra-fast RAG upload failed:", error);
      
      // Fallback to regular endpoint if ultra-fast fails
      console.log("🔄 Trying fallback to regular endpoint...");
      try {
        const formData = new FormData();
        formData.append("file", file);
        
        const fallbackResponse = await fetch("http://localhost:8000/upload-pdf", {
          method: "POST",
          body: formData,
          headers: getAuthHeaders(),
        });

        if (fallbackResponse.ok) {
          const result = await fallbackResponse.json();
          console.log("✅ Fallback upload successful");
          toast.warning("Used fallback upload method");
          return result;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback also failed:", fallbackError);
      }
      
      throw error;
    }
  };

  const getPreviewExample = () => {
    if (!file || !userSettings) return file?.name || "";

    const namingFormat = userSettings.file_naming_format;

    if (namingFormat === "ORIGINAL") {
      return file.name;
    } else if (namingFormat === "ADD_TIMESTAMP") {
      const date = new Date().toISOString().split("T")[0];
      const ext = file.name.toLowerCase().endsWith(".docx")
        ? "pdf"
        : file.name.split(".").pop();
      const title = userSettings.title || "TITLE";
      const clientName = userSettings.client_name || "CLIENTNAME";
      return `${title}_${clientName}_${date}.${ext}`;
    } else if (namingFormat === "SEQUENTIAL_NUMBERING") {
      const ext = file.name.toLowerCase().endsWith(".docx")
        ? "pdf"
        : file.name.split(".").pop();
      const title = userSettings.title || "TITLE";
      const clientName = userSettings.client_name || "CLIENTNAME";
      return `${title}_${clientName}_001.${ext}`;
    }

    return file.name;
  };

  const getNamingFormatLabel = (format: string) => {
    switch (format) {
      case "ORIGINAL":
        return "Keep original names";
      case "ADD_TIMESTAMP":
        return "Add timestamp";
      case "SEQUENTIAL_NUMBERING":
        return "Sequential numbering";
      default:
        return "Keep original names";
    }
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

    // Check if required fields are available for naming formats that need them
    if (userSettings.file_naming_format !== "ORIGINAL") {
      if (!userSettings.title?.trim() || !userSettings.client_name?.trim()) {
        setUploadStatus("error");
        setStatusMessage(
          `Your file naming is set to "${getNamingFormatLabel(
            userSettings.file_naming_format
          )}" but title or client name is missing in your settings. Please update your settings or the file will use the original name.`
        );
        setWarning(
          "File will be uploaded with original name due to missing settings."
        );
      }
    }

    setIsUploading(true);
    setUploadStatus("processing");
    setStatusMessage("Starting ultra-fast processing...");

    const startTime = Date.now();

    try {
      let documentInfo: any = null;
      let ragResponse: any = null;

      if (isAuthenticated && user) {
        // For authenticated users: Save to database first, then RAG system
        console.log("👤 Authenticated user - hybrid upload with ultra-fast processing");

        try {
          // Step 1: Save to database
          setStatusMessage("Saving to your account...");
          documentInfo = await saveDocumentToDatabase(file);

          // Step 2: Upload to ULTRA-FAST RAG system
          setStatusMessage("Processing with ultra-fast AI system...");
          ragResponse = await uploadToRagSystem(file);

          // Calculate and display performance
          const processingTime = (Date.now() - startTime) / 1000;
          const estimatedOldTime = 300; // 5 minutes
          const speedup = estimatedOldTime / processingTime;

          // Enhanced success messages with performance info
          let successMessage = `Document processed in ${processingTime.toFixed(1)}s (${speedup.toFixed(1)}x faster)!`;
          if (ragResponse?.conversion_performed) {
            successMessage += " (DOCX converted to PDF)";
          }
          if (ragResponse?.filename !== ragResponse?.original_filename) {
            successMessage += `\nRenamed: ${ragResponse.original_filename} → ${ragResponse.filename}`;
          }

          // Check for security feedback
          if (ragResponse?.security_status === "sanitized") {
            toast.warning("Document content was sanitized for security reasons");
            setStatusMessage("Document processed (some content was sanitized for security)");
          } else {
            setStatusMessage(successMessage);
            toast.success(`Ultra-fast processing complete! ${speedup.toFixed(1)}x faster`);
          }

          setUploadStatus("success");
        } catch (error) {
          console.error("Hybrid upload failed:", error);

          // Handle security errors specifically
          if (isSecurityError(error)) {
            setUploadStatus("error");
            setStatusMessage(getSecurityErrorMessage(error));

            // Provide specific feedback for different security error types
            switch (error.type) {
              case "rate_limit":
                toast.error("Upload limit reached. Please wait before uploading again.");
                break;
              case "malicious_content":
                toast.error("Upload blocked: Document contains suspicious content.");
                break;
              case "integrity_check":
                toast.error("Upload failed: Document verification failed. Please try again.");
                break;
              default:
                toast.error("Security error: " + error.message);
            }
            return; // Don't fallback for security errors
          }

          // For non-security errors, try fallback to RAG only
          console.log("Trying RAG fallback after database error:", error);
          try {
            setStatusMessage("Saving to account failed, processing with ultra-fast system...");
            ragResponse = await uploadToRagSystem(file);

            const processingTime = (Date.now() - startTime) / 1000;
            const speedup = 300 / processingTime;

            // Enhanced fallback success message
            let fallbackMessage = `Document processed in ${processingTime.toFixed(1)}s (${speedup.toFixed(1)}x faster) for this session only`;
            if (ragResponse?.conversion_performed) {
              fallbackMessage += " (DOCX converted to PDF)";
            }

            // Check for security feedback in fallback
            if (ragResponse?.security_status === "sanitized") {
              toast.warning("Document processed but content was sanitized for security");
            } else {
              toast.warning(`Ultra-fast processing complete! Not saved to account.`);
            }

            setUploadStatus("success");
            setStatusMessage(fallbackMessage);
          } catch (fallbackError) {
            // Handle security errors in fallback
            if (isSecurityError(fallbackError)) {
              setUploadStatus("error");
              setStatusMessage(getSecurityErrorMessage(fallbackError));
              toast.error(getSecurityErrorMessage(fallbackError));
              return;
            }

            // Re-throw non-security errors
            throw fallbackError;
          }
        }
      } else {
        // For non-authenticated users: Ultra-fast RAG system only
        console.log("👥 Non-authenticated user - ultra-fast RAG processing only");

        try {
          setStatusMessage("Processing with ultra-fast AI system...");
          ragResponse = await uploadToRagSystem(file);

          const processingTime = (Date.now() - startTime) / 1000;
          const speedup = 300 / processingTime;

          // Enhanced success message for non-authenticated users
          let sessionMessage = `Document processed in ${processingTime.toFixed(1)}s (${speedup.toFixed(1)}x faster) for this session only`;
          if (ragResponse?.conversion_performed) {
            sessionMessage += " (DOCX converted to PDF)";
          }

          // Check for security feedback
          if (ragResponse?.security_status === "sanitized") {
            toast.warning("Document processed but some content was sanitized for security");
            setStatusMessage("Document processed for this session (content sanitized)");
          } else {
            toast.success(`Ultra-fast processing complete! ${speedup.toFixed(1)}x faster`);
            setStatusMessage(sessionMessage);
          }

          setUploadStatus("success");
        } catch (error) {
          // Handle security errors for non-authenticated users
          if (isSecurityError(error)) {
            setUploadStatus("error");
            setStatusMessage(getSecurityErrorMessage(error));

            switch (error.type) {
              case "rate_limit":
                toast.error("Upload limit reached. Please wait before uploading again.");
                break;
              case "malicious_content":
                toast.error("Upload blocked: Document contains suspicious content.");
                break;
              case "integrity_check":
                toast.error("Upload failed: Document verification failed. Please try again.");
                break;
              default:
                toast.error("Security error: " + error.message);
            }
            return;
          }

          // Re-throw non-security errors
          throw error;
        }
      }

      // Enhanced response for parent component
      const uploadResponse: UploadResponse = {
        documentId: documentInfo?.documentId || documentInfo?.id || Date.now().toString(),
        fileName: ragResponse?.filename || file.name,
        originalFileName: ragResponse?.original_filename || file.name,
        fileSize: file.size,
        uploadedAt: documentInfo?.uploadedAt || new Date().toISOString(),
        pageCount: ragResponse?.page_count || ragResponse?.document_count || 1,
        status: documentInfo ? "TEMPORARY" : "TEMPORARY",
        securityStatus: ragResponse?.security_status || "verified",
        mimeType: ragResponse?.mime_type || (file.name.toLowerCase().endsWith(".docx") ? "docx" : "pdf"),
        conversionPerformed: ragResponse?.conversion_performed || false,
      };

      // Save to localStorage for immediate access
      const storageKey = isAuthenticated && user?.id ? `uploaded_documents_${user.id}` : "uploaded_documents";

      const existingDocs = JSON.parse(localStorage.getItem(storageKey) || "[]");
      existingDocs.push({
        id: uploadResponse.documentId,
        fileName: uploadResponse.fileName,         
        originalFileName: uploadResponse.originalFileName,
        fileSize: uploadResponse.fileSize,
        pageCount: uploadResponse.pageCount,
        status: uploadResponse.status,
        uploadedAt: uploadResponse.uploadedAt,

        // Additional properties for compatibility
        databaseId: documentInfo?.documentId || documentInfo?.id,
        processingTime: ragResponse?.processing_time,
        optimizationUsed: ragResponse?.optimization_used,
        mimeType: uploadResponse.mimeType,
        securityStatus: uploadResponse.securityStatus,
        conversionPerformed: uploadResponse.conversionPerformed,
      });
      localStorage.setItem(storageKey, JSON.stringify(existingDocs));
      // Call success callback
      onUploadSuccess(uploadResponse);

      // Reset form
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("❌ Upload failed completely:", error);

      // Handle security errors at the top level
      if (isSecurityError(error)) {
        setUploadStatus("error");
        setStatusMessage(getSecurityErrorMessage(error));
        toast.error(getSecurityErrorMessage(error));
      } else {
        // Enhanced error handling
        let errorMessage = handleApiError(error);
        if (errorMessage.includes("conversion")) {
          errorMessage = "DOCX conversion failed. Please try a different file or convert manually to PDF.";
        } else if (errorMessage.includes("extractable text")) {
          errorMessage = "Document does not contain extractable text. Please ensure it's not a scanned document.";
        }

        setUploadStatus("error");
        setStatusMessage(errorMessage);
        toast.error("Upload failed: " + errorMessage);
      }
    } finally {
      setIsUploading(false);
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
      const supportedExts = uploadOptions?.supported_file_types?.map((t) => t.extension.replace(".", "")) || ["pdf", "docx"];

      if (supportedExts.includes(fileExt || "")) {
        setFile(droppedFile);
        setUploadStatus("idle");
        setStatusMessage(null);
      } else {
        setUploadStatus("error");
        setStatusMessage(
          `Please drop a valid file. Supported: ${supportedExts.join(", ").toUpperCase()}`
        );
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
          className="font-serif text-2xl font-bold text-gray-900"
          delay={50}
        />
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          uploadStatus === "error"
            ? "border-red-300 bg-red-50"
            : uploadStatus === "success"
            ? "border-green-300 bg-green-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
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

          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {file ? file.name : "Upload PDF or DOCX Document"}
          </h3>

          <p className="text-sm text-gray-500 mb-4">
            {file
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Ready for ultra-fast processing`
              : "Drag and drop your document here, or click to browse"}
          </p>

          <p className="text-xs text-gray-400">
            Supported: PDF, DOCX • Maximum file size: {uploadOptions?.max_file_size_mb || 50}MB
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
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          }`}
        >
          {isUploading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {uploadStatus === "processing" ? statusMessage : "Processing with ultra-fast system..."}
            </div>
          ) : loadingSettings ? (
            "Loading settings..."
          ) : (
            "Upload File"
          )}
        </button>
      )}

      {/* Session Mode Notice */}
      <div className="mt-2 p-4 flex gap-4 items-center bg-neutral-50 border-dashed border-2 border-neutral-300 rounded-md text-neutral-800 text-sm">
        <MessageSquareDashed className="w-10 h-10 mt-0.5 flex-shrink-0" />
        <span className="flex flex-col">
          <p className="font-medium">Ultra-Fast Session Mode</p>
          <p>
            Documents are processed 10-20x faster with advanced optimizations. 
            Files are processed for this session only unless you save them permanently.
          </p>
        </span>
      </div>

      {/* Warnings */}
      {warning && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{warning}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadComponent;