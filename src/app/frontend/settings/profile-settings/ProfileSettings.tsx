"use client";
import React, { useEffect, useState, useRef } from "react";
import InputField from "../../components/ui/InputField";
import Image from "next/image";
import avatar from "../../img/user.png";
import { profileService } from "../../../../lib/api";
import LoaderComponent from "../../components/ui/LoaderComponent";
import { Save, Upload, Camera, X, Loader2, Trash2 } from "lucide-react";
import { toast, Toaster } from "sonner";
import { authUtils } from "@/lib/auth";

function ProfileSettings() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(""); // S3 URL for profile picture
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [changes, setChanges] = useState(false);
  const [imageError, setImageError] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = await profileService.getProfile();
        setName(user.name || "");
        setEmail(user.email || "");
        setJobTitle(user.job_title || "");
        setProfilePicture(user.profile_picture || "");
        setImageError(false); // Reset image error when new profile loads
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
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPEG, PNG, GIF, WebP)");
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB");
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
      setSelectedFile(file);
      setChanges(true);
      setImageError(false);
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
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to remove profile picture");
      }

      const data = await response.json();

      setProfilePicture("");
      setPreview(null);
      setSelectedFile(null);
      setChanges(true);
      setImageError(false);

      toast.success("Profile picture removed successfully");
    } catch (error) {
      console.error("Failed to remove profile picture:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove profile picture"
      );
    } finally {
      setUploading(false);
    }
  };

  const removeTemporaryProfilePicture = () => {
    if (preview) {
      URL.revokeObjectURL(preview); // Clean up blob URL
    }
    setPreview(null);
    setSelectedFile(null);
    setChanges(true);
    setImageError(false);
  };

  const validatePasswords = () => {
    if (newPassword && newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return false;
    }

    if (newPassword && newPassword.length < 8) {
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
      let uploadedImageUrl = profilePicture;

      // If there's a selected file, upload it first
      if (selectedFile) {
        console.log("📤 Uploading profile picture...");

        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch(
          "/backend/api/profile/upload-picture",
          {
            method: "POST",
            headers: getAuthHeaders(), // Don't set Content-Type for FormData
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse
            .json()
            .catch(() => ({ error: "Upload failed" }));
          throw new Error(errorData.error || "Failed to upload image");
        }

        const uploadResult = await uploadResponse.json();

        // Use the correct property from the response
        uploadedImageUrl =
          uploadResult.profile_picture_url ||
          uploadResult.user?.profile_picture;

        console.log(
          "✅ Profile picture uploaded successfully:",
          uploadedImageUrl
        );

        // Clean up preview
        if (preview) {
          URL.revokeObjectURL(preview);
        }
        setPreview(null);
        setSelectedFile(null);
        setImageError(false);

        // Update the profile picture URL immediately
        setProfilePicture(uploadedImageUrl);
      }

      // Update other profile fields
      const updateData: any = {
        name,
        job_title: jobTitle,
        profile_picture: uploadedImageUrl,
      };

      // Only include password fields if user is changing password
      if (newPassword && currentPassword) {
        updateData.current_password = currentPassword;
        updateData.new_password = newPassword;
      }

      const response = await profileService.updateProfile(updateData);

      // Clear password fields after successful update
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setChanges(false);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setUploading(false);
    }
  };

  // Handle image load error
  const handleImageError = () => {
    console.log("Image failed to load:", preview || profilePicture);
    setImageError(true);
  };

  // Handle image load success
  const handleImageLoad = () => {
    setImageError(false);
  };

  // Get the display image with priority: preview > profile picture (direct S3 URL) > default avatar
  const getDisplayImage = () => {
    if (preview) return preview;
    if (profilePicture && !imageError) return profilePicture; // Use direct S3 URL
    return avatar;
  };

  const displayImage = getDisplayImage();

  if (isLoading) {
    return <LoaderComponent />;
  }

  return (
    <div className="flex flex-col gap-1 pb-16 overflow-y-auto">
      <span className="flex flex-col gap-1 p-4 px-4">
        <h1 className="text-3xl font-bold font-serif">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile information and settings.
        </p>
      </span>

      <section className="flex flex-col-reverse md:flex-row space-x-50 px-2 md:px-6 h-full overflow-y-auto overflow-x-hidden">
        <div className="w-full md:w-auto flex flex-col mt-6 md:mt-0">
          <InputField
            label="Name"
            type="text"
            id="name"
            name="name"
            className="w-auto p-2 border border-tertiary rounded-md text-sm"
            placeholder="Enter your name"
            onChange={(e) => {
              setName(e.target.value);
              setChanges(true);
            }}
            value={name}
          />
          <InputField
            label="Email"
            type="text"
            id="email"
            name="email"
            className="w-auto p-2 border border-tertiary rounded-md text-sm"
            placeholder="Enter your email"
            onChange={(e) => {
              setEmail(e.target.value);
              setChanges(true);
            }}
            value={email}
          />
          <InputField
            label="Job Title"
            type="text"
            id="job_title"
            name="job_title"
            className="w-auto p-2 border border-tertiary rounded-md text-sm"
            placeholder="Lawyer, Paralegal, etc."
            onChange={(e) => {
              setJobTitle(e.target.value);
              setChanges(true);
            }}
            value={jobTitle}
          />
          <InputField
            label="Current Password"
            type="password"
            id="current_password"
            name="current_password"
            className="w-auto p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Enter your current password"
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setChanges(true);
            }}
            value={currentPassword}
          />
          <InputField
            label="New Password"
            type="password"
            id="new_password"
            name="new_password"
            className="w-auto p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Enter new password (min 8 characters)"
            onChange={(e) => {
              setNewPassword(e.target.value);
              setChanges(true);
            }}
            value={newPassword}
          />

          <InputField
            label="Confirm New Password"
            type="password"
            id="confirm_new_password"
            name="confirm_new_password"
            className="w-auto p-2 border border-gray-300 rounded-md text-sm"
            placeholder="Confirm new password"
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
              setChanges(true);
            }}
            value={confirmNewPassword}
          />

          {changes && (
            <button
              onClick={handleSaveChanges}
              disabled={uploading}
              className="block md:hidden w-fit p-2 m-2 border bg-gradient-to-bl from-blue-500 to-blue-800 text-white rounded-md text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </span>
            </button>
          )}
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex flex-col items-center gap-4">
            {/* Profile Picture Display */}
            <div className="relative group">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                {uploading ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <Image
                    src={displayImage}
                    alt="Profile"
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    unoptimized={!!preview} // Only unoptimized for blob URLs
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    priority={true}
                  />
                )}

                {/* Preview image cancel button */}
                {preview && !uploading && (
                  <button
                    onClick={removeTemporaryProfilePicture}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                    title="Cancel preview"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Hover Overlay for upload actions */}
                {!uploading && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      {/* Upload/Change Button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Change picture"
                      >
                        <Camera className="w-5 h-5 text-gray-700" />
                      </button>

                      {/* Remove Button - only show if there's a saved picture (not preview) */}
                      {profilePicture && !preview && (
                        <button
                          onClick={removeProfilePicture}
                          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                          title="Remove picture"
                          disabled={uploading}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Instructions */}
            <div className="text-center">
              <p className="text-sm text-blue-500">Select profile picture</p>
              <p className="text-xs text-gray-500 mt-1">
                JPEG, PNG, GIF, or WebP, max 5MB
              </p>
              {imageError && profilePicture && (
                <p className="text-xs text-red-500 mt-1">
                  Failed to load image. Using default avatar.
                </p>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div className="flex flex-col justify-end">
            {changes && (
              <button
                onClick={handleSaveChanges}
                disabled={uploading}
                className="hidden md:block w-fit mt-5 p-2 border bg-gradient-to-bl from-blue-500 to-blue-800 text-white rounded-md text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2">
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>
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
