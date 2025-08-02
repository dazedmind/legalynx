
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
  // ✅ NEW: Modified database save function that accepts the RAG filename
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

      // ✅ CRITICAL: Pass the RAG filename to the backend
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

  const uploadToRagSystem = async (file: File): Promise<any> => {
    try {
      console.log("🚀 Uploading to RAG system...");
  
      // Use the same URL consistently
      const RAG_BASE_URL = process.env.NEXT_PUBLIC_RAG_API_URL || "http://localhost:8000";
  
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
  
      // Add title and client name from user settings if available
      if (userSettings?.title?.trim()) {
        formData.append("title", userSettings.title.trim());
      }
      if (userSettings?.client_name?.trim()) {
        formData.append("client_name", userSettings.client_name.trim());
      }
  
      // 🔥 FIXED: Use the single consolidated endpoint
      const response = await fetch(`${RAG_BASE_URL}/upload-pdf`, {
        method: "POST",
        body: formData,
        headers: getAuthHeaders(),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Upload failed");
      }
  
      const ragResponse = await response.json();
      console.log("✅ RAG upload successful:", ragResponse);
      console.log(
        `⚡ Processing time: ${ragResponse.processing_time?.toFixed(2)}s`
      );
      console.log(`🎯 Optimization used: ${ragResponse.optimization_used}`);
  
      // Show performance improvement in toast
      if (ragResponse.processing_time) {
        const oldTime = 300; // 5 minutes
        const speedup = oldTime / ragResponse.processing_time;
        toast.success(
          `Processing complete! ${speedup.toFixed(
            1
          )}x faster than before`
        );
      }
  
      return ragResponse;
    } catch (error) {
      console.error("❌ RAG upload failed:", error);
      throw error;
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

    setIsUploading(true);
    setUploadStatus("processing");
    setStatusMessage("Starting ultra-fast processing...");

    const startTime = Date.now();

    try {
      let documentInfo: any = null;
      let ragResponse: any = null;

      if (isAuthenticated && user) {
        // ✅ NEW WORKFLOW: RAG processing FIRST, then database save
        console.log(
          "👤 Authenticated user - RAG-first workflow with ultra-fast processing"
        );

        try {
          // Step 1: Upload to ULTRA-FAST RAG system FIRST
          setStatusMessage("Processing document...");
          ragResponse = await uploadToRagSystem(file);

          // Step 2: Save to database using the filename from RAG response
          setStatusMessage("Preparing document...");
          documentInfo = await saveDocumentToDatabaseWithFilename(
            file,
            ragResponse.filename
          );

          // Calculate and display performance
          const processingTime = (Date.now() - startTime) / 1000;
          const estimatedOldTime = 300; // 5 minutes
          const speedup = estimatedOldTime / processingTime;

          // Enhanced success messages with performance info
          let successMessage = `Document processed in ${processingTime.toFixed(
            1
          )}s (${speedup.toFixed(1)}x faster)!`;
          if (ragResponse?.conversion_performed) {
            successMessage += " (DOCX converted to PDF)";
          }
          if (ragResponse?.filename !== ragResponse?.original_filename) {
            successMessage += `\nRenamed: ${ragResponse.original_filename} → ${ragResponse.filename}`;
          }

          // Check for security feedback
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

          // Handle security errors specifically
          if (isSecurityError(error)) {
            setUploadStatus("error");
            setStatusMessage(getSecurityErrorMessage(error));
            // Don't fallback for security errors
            return;
          }

          // For non-security errors, try fallback to RAG only (no database save)
          console.log("Trying RAG-only fallback after database error:", error);
          try {
            setStatusMessage(
              "Account save failed, processing for session only..."
            );
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

        setStatusMessage("Processing with ultra-fast AI system...");
        ragResponse = await uploadToRagSystem(file);

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

      // ✅ FIXED: Use the correct filename from RAG response
      const uploadResponse: UploadResponse = {
        documentId:
          documentInfo?.documentId || documentInfo?.id || Date.now().toString(),
        fileName: ragResponse?.filename || file.name,
        originalFileName: ragResponse?.original_filename || file.name,
        fileSize: file.size,
        uploadedAt: documentInfo?.uploadedAt || new Date().toISOString(),
        pageCount: ragResponse?.pages_processed || 1, // ✅ FIXED: Use pages_processed
        status: documentInfo ? "TEMPORARY" : "TEMPORARY",
        securityStatus: ragResponse?.security_status || "verified",
        mimeType:
          ragResponse?.mime_type ||
          (file.name.toLowerCase().endsWith(".docx") ? "docx" : "pdf"),
        conversionPerformed: ragResponse?.conversion_performed || false,
      };

      // ✅ FIXED: Save to localStorage with correct field names from RAG response
      const storageKey =
        isAuthenticated && user?.id
          ? `uploaded_documents_${user.id}`
          : "uploaded_documents";

      const existingDocs = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const documentForStorage = {
        // Use field names that ChatViewer expects with RAG response data
        id: uploadResponse.documentId,
        fileName: ragResponse?.filename || file.name,
        originalFileName: ragResponse?.original_filename || file.name,
        original_file_name: ragResponse?.original_filename || file.name, // Backward compatibility
        fileSize: uploadResponse.fileSize,
        file_size: uploadResponse.fileSize, // Backward compatibility
        pageCount: ragResponse?.pages_processed || 1, // ✅ FIXED: Use pages_processed directly
        page_count: ragResponse?.pages_processed || 1, // ✅ FIXED: Use pages_processed directly
        status: uploadResponse.status,
        uploadedAt: uploadResponse.uploadedAt,
        uploaded_at: uploadResponse.uploadedAt, // Backward compatibility

        // Additional properties for compatibility
        databaseId: documentInfo?.documentId || documentInfo?.id,
        processingTime: ragResponse?.processing_time,
        optimizationUsed: ragResponse?.optimization_used,
        mimeType: uploadResponse.mimeType,
        securityStatus: uploadResponse.securityStatus,
        conversionPerformed: uploadResponse.conversionPerformed,
      };

      existingDocs.push(documentForStorage);
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
      } else {
        setUploadStatus("error");
        setStatusMessage(
          `Please drop a valid file. Supported: ${supportedExts
            .join(", ")
            .toUpperCase()}`
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
              ? "bg-tertiary text-muted-foreground cursor-not-allowed"
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

      {/* Warnings */}
      {warning && (
        <div className="mb-4 p-3 bg-yellow-100/20 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{warning}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadComponent;
