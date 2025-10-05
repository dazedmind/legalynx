"use client";
import React, { useEffect, useState, useRef } from "react";
import InputField from "../../components/ui/InputField";
import Image from "next/image";
import avatar from "../../img/user.png";
import { profileService } from "../../../../lib/api";
import LoaderComponent from "../../components/ui/LoaderComponent";
import { Save, Upload, Camera, X, Loader2, Trash2, User, Lock, Briefcase, Mail } from "lucide-react";
import { toast, Toaster } from "sonner";
import { authUtils } from "@/lib/auth";
import { FloatingSaveBar } from "../../components/layout/FloatingSaveBar";

interface UserSettings {
  name: string;
  email: string;
  job_title: string;
  profile_picture: string;
  current_password: string;
  new_password: string;
  confirm_new_password: string;
}


function ProfileSettings() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  

  const [settings, setSettings] = useState<UserSettings>({
    name: "",
    email: "",
    job_title: "",
    profile_picture: "",
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });

  const [originalSettings, setOriginalSettings] = useState<UserSettings>({
    name: "",
    email: "",
    job_title: "",
    profile_picture: "",
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await profileService.getProfile();
        const loadedSettings = {
          name: user.name || "",
          email: user.email || "",
          job_title: user.job_title || "",
          profile_picture: user.profile_picture || "",
          current_password: "",
          new_password: "",
          confirm_new_password: "",
        };

        setName(loadedSettings.name);
        setEmail(loadedSettings.email);
        setJobTitle(loadedSettings.job_title);
        setProfilePicture(loadedSettings.profile_picture);
        setOriginalSettings(loadedSettings);
        setImageError(false);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("Failed to load profile");
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const getAuthHeaders = () => {
    const token = authUtils.getToken();
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, GIF, WebP)");
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB");
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      setSelectedFile(file);
      setImageError(false);
      setHasUnsavedChanges(true);
      toast.success('Image selected! Click "Save Changes" to upload.');
    }
  };
  
  const removeProfilePicture = async () => {
    try {
      setUploading(true);

      const response = await fetch("/backend/api/profile/remove-picture", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to remove profile picture");
      }

      // Update local state to reflect removal
      setProfilePicture("");
      setSettings({ ...settings, profile_picture: "" });
      setOriginalSettings({ ...originalSettings, profile_picture: "" });
      setPreview(null);
      setSelectedFile(null);
      setImageError(false);

      toast.success("Profile picture removed from S3 and database");
    } catch (error) {
      console.error("Failed to remove profile picture:", error);
      toast.error(error instanceof Error ? error.message : "Failed to remove profile picture");
    } finally {
      setUploading(false);
    }
  };

  const removeTemporaryProfilePicture = () => {
    // Remove preview of newly selected file (not yet uploaded to S3)
    // No S3 deletion needed as the file hasn't been uploaded yet
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setSelectedFile(null);
    setHasUnsavedChanges(false); // No unsaved changes since we're reverting to original
    setImageError(false);
  };

  const validatePasswords = () => {
    if (settings.new_password && settings.new_password !== settings.confirm_new_password) {
      toast.error("New passwords do not match");
      return false;
    }

    if (settings.new_password && settings.new_password.length < 8) {
      toast.error("New password must be at least 8 characters");
      return false;
    }

    return true;
  };

  const handleSaveChanges = async () => {
    if (!validatePasswords()) {
      return;
    }

    setUploading(true);

    try {
      let uploadedImageUrl = settings.profile_picture;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/backend/api/profile/upload-picture", {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(errorData.error || "Failed to upload image");
        }

        const uploadResult = await uploadResponse.json();
        uploadedImageUrl = uploadResult.profile_picture_url || uploadResult.user?.profile_picture;

        if (preview) {
          URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setSelectedFile(null);
        setImageError(false);
        setSettings({ ...settings, profile_picture: uploadedImageUrl });
      }

      const updateData: any = {
        name: name,
        job_title: jobTitle,
        profile_picture: uploadedImageUrl,
      };

      if (settings.new_password && settings.current_password) {
        updateData.current_password = currentPassword;
        updateData.new_password = newPassword;
      }

      await profileService.updateProfile(updateData);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setHasUnsavedChanges(false);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const getDisplayImage = () => {
    if (preview) return preview;
    if (profilePicture && !imageError) return profilePicture;
    return avatar;
  };

  const discardChanges = () => {
    // Revert to original settings
    setName(originalSettings.name);
    setEmail(originalSettings.email);
    setJobTitle(originalSettings.job_title);
    setProfilePicture(originalSettings.profile_picture);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");

    // Clear any temporary preview
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setSelectedFile(null);

    setHasUnsavedChanges(false);
  };

  const displayImage = getDisplayImage();

  if (isLoading) {
    return <LoaderComponent />;
  }

  return (
    <div className="min-h-screen pb-6">
      <span className='flex flex-col gap-1 p-4 pb-2 px-4'>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif">Profile Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your file settings and preferences.
            </p>
          </div>
        </div>
      </span>

      <div className="max-w-5xl p-4">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Card */}
          <div className="lg:col-span-1">
            <div className="bg-primary rounded-xl p-6 ">
              <h2 className="text-lg text-center font-semibold mb-4 text-foreground">Profile Picture</h2>

              <div className="flex flex-col items-center gap-4">
                {/* Profile Picture Display */}
                <div className="relative group">
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-border bg-muted shadow-lg">
                    {uploading ? (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Image
                        src={displayImage}
                        alt="Profile"
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                        unoptimized={!!preview}
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        priority={true}
                      />
                    )}

                    {/* Preview Cancel Button */}
                    {preview && !uploading && (
                      <button
                        onClick={removeTemporaryProfilePicture}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
                        title="Cancel preview"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Hover Overlay */}
                    {!uploading && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-3">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg cursor-pointer"
                            title="Change picture"
                          >
                            <Camera className="w-5 h-5 text-gray-700" />
                          </button>

                          {profilePicture && !preview && (
                            <button
                              onClick={removeProfilePicture}
                              className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg cursor-pointer"
                              title="Remove picture"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload Info */}
                <div className="text-center">
                  <p className="text-sm font-medium text-primary">Change profile picture</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG, PNG, GIF, or WebP · Max 5MB
                  </p>
                  {imageError && profilePicture && (
                    <p className="text-xs text-red-500 mt-1">
                      Failed to load image
                    </p>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Form Fields Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="border border-tertiary rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-yellow-500" />
                Personal Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="your@email.com"
                      className="w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => {
                        setJobTitle(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Lawyer, Paralegal, etc."
                      className="w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className=" border border-tertiary rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                <Lock className="w-5 h-5 text-yellow-500" />
                Security Settings
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter new password (min 8 characters)"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-foreground"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Leave password fields empty if you don't want to change your password
                </p>
              </div>
            </div>
          
          </div>
        </div>
      </div>

      <FloatingSaveBar
        isVisible={hasUnsavedChanges}
        onSave={handleSaveChanges}
        onDiscard={discardChanges}
        isSaving={isSaving}
      />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
        }}
      />
    </div>
  );
}

export default ProfileSettings;