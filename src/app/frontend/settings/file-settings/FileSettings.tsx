import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  HardDrive,
  AlertCircle,
  Loader2,
  Sparkle,
} from "lucide-react";
import { GoCloud } from "react-icons/go";
import { Progress } from "@/app/frontend/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/app/frontend/components/ui/dropdown-menu";
import { Switch } from "@/app/frontend/components/ui/switch";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";
import { authUtils } from "@/lib/auth";
import LoaderComponent from "../../components/ui/LoaderComponent";
import { profileService } from "../../../../lib/api";
import { Separator } from "@/app/frontend/components/ui/separator";
import { FloatingSaveBar } from "../../components/layout/FloatingSaveBar";

// Helper function to format bytes to appropriate unit (KB, MB, GB)
const formatStorageSize = (bytes: number): { value: number; unit: string } => {
  if (bytes === 0) return { value: 0, unit: 'MB' };

  const kb = bytes / 1024;
  const mb = kb / 1024;
  const gb = mb / 1024;

  if (gb >= 1) {
    return { value: parseFloat(gb.toFixed(2)), unit: 'GB' };
  } else if (mb >= 1) {
    return { value: parseFloat(mb.toFixed(2)), unit: 'MB' };
  } else {
    return { value: parseFloat(kb.toFixed(2)), unit: 'KB' };
  }
};

const retentionOptions = [
  { value: null, label: "Never" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
  { value: 90, label: "90 days" },
];

const renamingFormats = [
  {
    value: "ADD_TIMESTAMP",
    label: "Add Document Type",
    example: "YYYYMMDD_DOCUMENT-TYPE.pdf",
  },
  {
    value: "ADD_CLIENT_NAME",
    label: "Add Document Type and Client Name",
    example: "YYYYMMDD_DOCUMENT-TYPE_ENTITY.pdf",
  },
];

interface UserSettings {
  auto_rename_files: boolean;
  file_naming_format: "ORIGINAL" | "ADD_TIMESTAMP" | "ADD_CLIENT_NAME";
  file_retention_days: number | null;
  auto_delete_files: boolean;
}

interface StorageInfo {
  used: number; // in bytes
  total: number; // in bytes
  available: number; // in bytes
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

  // Store original settings for discard functionality
  const [originalSettings, setOriginalSettings] = useState<UserSettings>({
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
    total: 100 * 1024 * 1024, // 100MB in bytes (default for BASIC)
    available: 100 * 1024 * 1024,
  });
  const [subscription, setSubscription] = useState<string>("BASIC");

  // Load settings on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      const loadData = async () => {
        await getSubscription();
        await loadUserSettings();
        await loadStorageInfo();
      };
      loadData();
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
    setSubscription(subscription.plan_type.toUpperCase());
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
        const loadedSettings = {
          auto_rename_files: data.auto_rename_files || false,
          file_naming_format: data.file_naming_format || "ORIGINAL",
          file_retention_days: data.file_retention_days,
          auto_delete_files: data.auto_delete_files || false,
        };
        
        setSettings(loadedSettings);
        // Store originals for discard functionality
        setOriginalSettings(loadedSettings);
      } else if (response.status === 404) {
        // No settings found, use defaults
        console.log("No user settings found, using defaults");
        const defaultSettings = {
          auto_rename_files: false,
          file_naming_format: "ORIGINAL" as const,
          file_retention_days: null,
          auto_delete_files: false,
        };
        setSettings(defaultSettings);
        setOriginalSettings(defaultSettings);
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
      console.log('🔄 Loading storage info...');

      const response = await fetch("/backend/api/user-settings/storage", {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Storage response:', data);

        // API returns used, total, and available in bytes
        const usedBytes = data.used || 0;
        const totalBytes = data.total || (subscription === "BASIC" ? 100 * 1024 * 1024 : subscription === "STANDARD" ? 1 * 1024 * 1024 * 1024 : 10 * 1024 * 1024 * 1024);
        const availableBytes = data.available || (totalBytes - usedBytes);

        setStorageInfo({
          used: usedBytes,
          total: totalBytes,
          available: availableBytes,
        });

        console.log('💾 Storage info set:', {
          used: usedBytes,
          total: totalBytes,
          available: availableBytes,
          formattedUsed: formatStorageSize(usedBytes)
        });
      } else {
        console.error('❌ Storage API error:', response.status);
      }
    } catch (error) {
      console.error("Failed to load storage info:", error);
      // Use default values on error (in bytes)
      const totalBytes = subscription === "BASIC" ? 100 * 1024 * 1024 : subscription === "STANDARD" ? 1 * 1024 * 1024 * 1024 : 10 * 1024 * 1024 * 1024;
      setStorageInfo({
        used: 0,
        total: totalBytes,
        available: totalBytes,
      });
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
        // Update originals to current values
        setOriginalSettings({ ...settings });
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

  const discardChanges = () => {
    // Revert to original settings
    setSettings({ ...originalSettings });
    setHasUnsavedChanges(false);
    toast.info("Changes discarded");
  };

  if (isLoading) {
    return <LoaderComponent />;
  }

  const storagePercentage =
    storageInfo.total > 0 ? (storageInfo.used / storageInfo.total) * 100 : 0;

  // Format only the used storage dynamically (KB/MB/GB)
  const formattedUsed = formatStorageSize(storageInfo.used);

  // Total and Available are fixed based on subscription tier
  const getTierStorage = () => {
    if (subscription === "BASIC") {
      return { value: 50, unit: "MB" };
    } else if (subscription === "STANDARD") {
      return { value: 1, unit: "GB" };
    } else { // PREMIUM
      return { value: 10, unit: "GB" };
    }
  };

  const tierStorage = getTierStorage();
  const availableInBytes = storageInfo.total - storageInfo.used;
  const formattedAvailable = formatStorageSize(availableInBytes);

  return (
    <div className="space-y-4 pb-6"> {/* Added padding bottom for floating bar */}
      <span className='flex flex-col gap-1 p-4 pb-2 px-4'>
            <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif">File Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your file settings and preferences.
            </p>
          </div>
        </div>
      </span>

      {/* File Settings Preference */}
      <section className="mx-4 p-6 rounded-lg border border-tertiary bg-primary">
        <div className="flex items-center gap-3 mb-4">
          <Sparkle className="w-6 h-6 text-yellow-500" />
          <div>
            <h2 className="text-xl font-semibold">File Preferences</h2>
          </div>
        </div>

        {/* Divider */}
        <Separator className="my-4"/>

        <div className="space-y-6">
          {/* File Expiration */}
          <div className="flex items-center justify-between">
            <span>
              <h3 className="font-bold">File Expiration</h3>
              <p className="text-sm text-muted-foreground">
                Select file retention time
              </p>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-between border border-tertiary rounded-md p-2 text-sm cursor-pointer min-w-[120px] text-left bg-primary"
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
                        ? "font-semibold bg-blue/20"
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
          {/* Auto-rename files */}
          <div className="flex items-center justify-between">
              <span>
                <h3 className="font-bold">Auto-rename files</h3>
                <p className="text-sm text-muted-foreground">Auto-format file names on upload</p>
              </span>
              <Switch
                checked={settings.auto_rename_files}
                onCheckedChange={(checked) =>
                  handleSettingChange("auto_rename_files", checked)
                }
                className="cursor-pointer"
              />
          </div>
          {/* File Renaming Format */}
          {settings.auto_rename_files && (
            <div className="p-1 rounded-md  flex flex-col gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Select format</p>
              </div>

              <div className="space-y-2">
                {renamingFormats.map((format) => (
                  <label
                    key={format.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      settings.file_naming_format === format.value
                        ? "border-blue/20 bg-blue/20"
                        : "border-tertiary hover:border-accent"
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
                            | "ADD_TIMESTAMP"
                            | "ADD_CLIENT_NAME"
                        )
                      }
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{format.label}</div>
                      <div className="text-sm text-muted-foreground">
                        Example:{" "}
                        <code className="bg-accent px-1 rounded text-xs">
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
      <section className="mx-4 p-6 mb-8 rounded-lg border border-tertiary bg-primary">
        <div className="flex items-center gap-3 mb-4">
          <GoCloud className="w-6 h-6 text-yellow-500" strokeWidth={1} />
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-semibold">Storage Usage</h2>
            <p className="text-md font-bold text-foreground">
              {tierStorage.value} {tierStorage.unit} limit
            </p>
          </div>
        </div>

        {/* Divider */}
        <Separator className="my-4"/>

        <div className="mt-6 space-y-2">
          <span className="flex items-center gap-2">
            <HardDrive className="w-8 h-8" />
            <h1 className="text-xl font-bold">
              {formattedUsed.value} {formattedUsed.unit} / {tierStorage.value} {tierStorage.unit}
            </h1>
            <p className="text-sm text-muted-foreground">used ({storagePercentage.toFixed(1)}%)</p>
          </span>
          <Progress value={storagePercentage} />

          {/* ✅ Show helpful messages based on actual usage */}
          {storageInfo.used === 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/20  rounded text-blue-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              No documents uploaded yet. Upload a document to see your storage usage.
            </div>
          )}

          {storagePercentage >= 80 && storageInfo.used > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              {storagePercentage >= 90
                ? "Storage is almost full. Consider upgrading or deleting unused files."
                : "Storage is getting full. You may want to clean up old files."}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-center mt-4">
          <div className="p-3 bg-blue/20 rounded">
            <div className="text-lg font-bold text-blue-700">
              {formattedUsed.value} {formattedUsed.unit}
            </div>
            <div className="text-xs text-blue-700">Used</div>
          </div>
          <div className="p-3 bg-accent rounded">
            <div className="text-lg font-bold text-muted-foreground">
              {formattedAvailable.value} {formattedAvailable.unit}
            </div>
            <div className="text-xs text-muted-foreground">Available</div>
          </div>
        </div>
      </section>

      {/* Floating Save Changes Bar */}
      <FloatingSaveBar
        isVisible={hasUnsavedChanges}
        onSave={handleSaveSettings}
        onDiscard={discardChanges}
        isSaving={isSaving}
      />
    </div>
  );
}