import React, { useState, useEffect } from "react";
import InputField from "../components/ui/InputField";
import {
  ChevronDown,
  HardDrive,
  Save,
  AlertCircle,
  Loader2,
  File,
  Cloud,
  Sparkle,
} from "lucide-react";
import { GoCloud } from "react-icons/go";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { authUtils } from "@/lib/auth";
import LoaderComponent from "../components/ui/LoaderComponent";
import { profileService } from "../lib/api";
import { Separator } from "@/components/ui/separator";

const retentionOptions = [
  { value: null, label: "Never" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
];

const renamingFormats = [
  { value: "ORIGINAL", label: "Keep original names", example: "document.pdf" },
  {
    value: "ADD_TIMESTAMP",
    label: "Add timestamp",
    example: "document_2024-01-15.pdf",
  },
  {
    value: "SEQUENTIAL_NUMBERING",
    label: "Sequential numbering",
    example: "document_001.pdf",
  },
];

interface UserSettings {
  auto_rename_files: boolean;
  file_naming_format: "ORIGINAL" | "ADD_TIMESTAMP" | "SEQUENTIAL_NUMBERING";
  file_retention_days: number | null;
  auto_delete_files: boolean;
}

interface StorageInfo {
  used: number;
  total: number;
  available: number;
}

export default function FileSettings() {
  const { user, isAuthenticated } = useAuth();

  // Settings state
  const [settings, setSettings] = useState<UserSettings>({
    auto_rename_files: false,
    file_naming_format: "ORIGINAL",
    file_retention_days: null,
    auto_delete_files: false,
  });

  // UI state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    used: 0,
    total: 10,
    available: 10,
  });
  const [subscription, setSubscription] = useState<string>("BASIC");

  // Load settings on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserSettings();
      loadStorageInfo();
      getSubscription();
    }
  }, [isAuthenticated, user]);

  const getAuthHeaders = () => {
    const token = authUtils.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const getSubscription = async () => {
    const response = await profileService.getProfile();
    const subscription = response.subscription;
    setSubscription(subscription.plan_type);
  };

  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/backend/api/user-settings", {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({
          auto_rename_files: data.auto_rename_files || false,
          file_naming_format: data.file_naming_format || "ORIGINAL",
          file_retention_days: data.file_retention_days,
          auto_delete_files: data.auto_delete_files || false,
        });
      } else if (response.status === 404) {
        // No settings found, use defaults
        console.log("No user settings found, using defaults");
      } else {
        throw new Error("Failed to load settings");
      }
    } catch (error) {
      console.error("Failed to load user settings:", error);
      toast.error("Failed to load your settings");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const response = await fetch("/backend/api/user-settings/storage", {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setStorageInfo({
          used: data.used_gb || 0,
          total: data.total_gb || 10,
          available: data.available_gb || 10,
        });
      }
    } catch (error) {
      console.error("Failed to load storage info:", error);
      // Use default values on error
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleRetentionChange = (value: number | null) => {
    handleSettingChange("file_retention_days", value);
    handleSettingChange("auto_delete_files", value !== null);
  };

  const handleSaveSettings = async () => {
    if (!isAuthenticated || !user) {
      toast.error("You must be logged in to save settings");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/backend/api/user-settings", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        toast.success("Settings saved successfully");

        // Reload storage info after saving
        loadStorageInfo();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoaderComponent />;
  }

  const storagePercentage =
    storageInfo.total > 0 ? (storageInfo.used / storageInfo.total) * 100 : 0;

  return (
    <div className="space-y-4">
      <span className="flex flex-col gap-1 p-6 pb-2 px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif">File Settings</h1>
            <p className="text-sm text-gray-500">
              Manage your file settings and preferences.
            </p>
          </div>
        </div>

        {hasUnsavedChanges && (
          <div>
            <div className="flex justify-between items-center gap-2 mt-4 p-3 bg-yellow/5 border border-yellow rounded-lg text-yellow text-sm">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                You have unsaved changes
              </span>

              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="flex items-center gap-2 p-2 bg-yellow text-white text-sm rounded-md hover:bg-yellow/80 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {/* <Save className="w-4 h-4" /> */}
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </span>

      {/* File Settings Preference */}
      <section className="mx-8 p-6 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <Sparkle className="w-6 h-6 text-yellow-500" />
          <div>
            <h2 className="text-xl font-semibold">File Preferences</h2>
          </div>
        </div>

        {/* Divider */}
        <Separator className="my-4"/>

        <div className="space-y-6">
          {/* Auto-rename files */}
          <div className="flex items-center justify-between">
            <span>
              <h3 className="font-bold">Auto-rename files</h3>
              <p className="text-sm text-gray-600">Enable auto-rename files</p>
            </span>
            <Switch
              checked={settings.auto_rename_files}
              onCheckedChange={(checked) =>
                handleSettingChange("auto_rename_files", checked)
              }
              className="cursor-pointer"
            />
          </div>


          {/* File Expiration */}
          <div className="flex items-center justify-between">
            <span>
              <h3 className="font-bold">File Expiration</h3>
              <p className="text-sm text-gray-600">
                Select file retention time
              </p>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-between border border-gray-300 rounded-md p-2 text-sm cursor-pointer min-w-[120px] text-left bg-white"
                  type="button"
                >
                  {retentionOptions.find(
                    (opt) => opt.value === settings.file_retention_days
                  )?.label || "Select"}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {retentionOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value?.toString() || "never"}
                    onSelect={() => handleRetentionChange(option.value)}
                    className={`flex flex-col items-start p-2 ${
                      settings.file_retention_days === option.value
                        ? "font-semibold bg-accent"
                        : ""
                    } cursor-pointer`}
                  >
                    <span>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {settings.file_retention_days && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded text-blue-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              Files will be automatically deleted after{" "}
              {retentionOptions
                .find((opt) => opt.value === settings.file_retention_days)
                ?.label.toLowerCase()}
            </div>
          )}

          {/* File Renaming Format */}
          {settings.auto_rename_files && (
            <div className="p-1 rounded-md  flex flex-col gap-3">
              <div>
                <p className="text-sm text-gray-500">Select format</p>
              </div>

              <div className="space-y-2">
                {renamingFormats.map((format) => (
                  <label
                    key={format.value}
                    className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                      settings.file_naming_format === format.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="renamingFormat"
                      value={format.value}
                      checked={settings.file_naming_format === format.value}
                      onChange={() =>
                        handleSettingChange(
                          "file_naming_format",
                          format.value as
                            | "ORIGINAL"
                            | "TIMESTAMP"
                            | "SEQUENTIAL"
                        )
                      }
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{format.label}</div>
                      <div className="text-sm text-gray-500">
                        Example:{" "}
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {format.example}
                        </code>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* Storage Usage */}
      <section className="mx-8 p-6 mb-8 rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <GoCloud className="w-6 h-6 text-yellow-500" strokeWidth={1} />
          <div>
            <h2 className="text-xl font-semibold">Storage Usage</h2>
          </div>
        </div>

        {/* Divider */}
        <Separator className="my-4"/>

        <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-yellow-50 rounded">
              <div className="text-lg font-bold text-yellow">
                {storageInfo.used.toFixed(1)}{" "}
                {subscription == "BASIC" ? "MB" : "GB"}
              </div>
              <div className="text-xs text-gray-500">Used</div>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue">
                {storageInfo.available.toFixed(1)}{" "}
                {subscription == "BASIC" ? "MB" : "GB"}
              </div>
              <div className="text-xs text-gray-500">Available</div>
            </div>
        </div>

        <div className="mt-6 space-y-2">
          <span className="flex items-center gap-2">
                <HardDrive className="w-8 h-8" />
                <h1 className="text-xl font-bold">
                  {storageInfo.used.toFixed(1)} {subscription == "BASIC" ? "MB" : "GB"} / {storageInfo.total} {subscription == "BASIC" ? "MB" : "GB"}
                </h1>
                <p>used ({storagePercentage.toFixed(1)}%)</p>
          </span>
          <Progress value={storagePercentage} />

          {storagePercentage >= 80 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              {storagePercentage >= 90
                ? "Storage is almost full. Consider upgrading or deleting unused files."
                : "Storage is getting full. You may want to clean up old files."}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}
