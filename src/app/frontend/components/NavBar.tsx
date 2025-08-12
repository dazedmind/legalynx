"use client";
import { LogOut, Settings, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import avatar from "../img/user.png";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { profileService, UserProfile } from "../lib/api";
import { GoGift } from "react-icons/go";
import logo from "../img/legalynxlogo.png";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "next-themes";

export default function NavBar() {
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { theme } = useTheme();

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError("");

      const userProfile = await profileService.getProfile();

      console.log("✅ NavBar: Profile loaded successfully:", {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        hasProfilePicture: !!userProfile.profile_picture,
      });

      setProfile(userProfile as UserProfile);
      setError("");
    } catch (error) {
      console.error("❌ NavBar: Profile load failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setProfile(null);
    setError("");
  };

  const getDisplayName = () => {
    if (loading) return "Loading...";
    if (profile?.name) return profile.name;
    if (profile?.email) return profile.email.split("@")[0];
    if (user?.email) return user.email.split("@")[0];
    return "User";
  };

  const getSubscriptionStatus = () => {
    if (profile?.subscription?.plan_type === "PREMIUM") return "PREMIUM";
    if (profile?.subscription?.plan_type === "STANDARD") return "STANDARD";
    if (profile?.subscription?.plan_type === "BASIC") return "BASIC";
    return "BASIC";
  };

  const getInitials = () => {
    if (loading) return "...";

    if (profile?.name) {
      const names = profile.name.trim().split(" ");
      if (names.length === 1) return names[0][0]?.toUpperCase() || "";
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    if (profile?.email) return profile.email[0]?.toUpperCase() || "";
    if (user?.email) return user.email[0]?.toUpperCase() || "";
    return "?";
  };

  // Check if the profile picture is a valid S3 URL for profile pictures
  const isValidProfilePictureUrl = (url: string) => {
    if (!url) return false;
    // Only allow our specific S3 bucket URLs for profile pictures
    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || "legalynx";
    const region = process.env.NEXT_PUBLIC_AWS_REGION || "ap-southeast-2";

    const validPatterns = [
      `https://${bucketName}.s3.${region}.amazonaws.com/profile-pictures/`,
      `https://${bucketName}.s3.amazonaws.com/profile-pictures/`,
      `https://s3.${region}.amazonaws.com/${bucketName}/profile-pictures/`,
    ];

    return validPatterns.some((pattern) => url.startsWith(pattern));
  };

  const hasValidProfilePicture = () => {
    return (
      profile?.profile_picture &&
      isValidProfilePictureUrl(profile.profile_picture)
    );
  };

  const ProfileAvatar = ({ size = 40 }: { size?: number }) => {
    if (loading) {
      return (
        <div
          className="cursor-pointer rounded-full bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <div
            className="bg-gray-300 rounded-full"
            style={{ width: size * 0.6, height: size * 0.6 }}
          ></div>
        </div>
      );
    }

    if (hasValidProfilePicture()) {
      return (
        <Image
          src={profile!.profile_picture!}
          alt="Profile"
          width={size}
          height={size}
          className="rounded-full cursor-pointer border border-gray-300"
          unoptimized={false} // Let Next.js optimize since it's now a valid external URL
          onError={(e) => {
            // On error, hide the image element and show fallback
            console.log("Profile image failed to load, showing fallback");
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = "flex";
            }
          }}
        />
      );
    }

    return (
      <div
        className="cursor-pointer rounded-full bg-gradient-to-bl from-blue-700 to-blue-300 flex items-center justify-center text-white font-medium"
        style={{
          width: size,
          height: size,
          fontSize: size < 30 ? "12px" : size < 40 ? "14px" : "18px",
        }}
      >
        {getInitials()}
      </div>
    );
  };

  return (
    <div
      className="px-0 md:px-8 py-2 bg-primary"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Image src={logo} alt="LegalynX" width={60} height={60} />
          <div>
            <Link href="/frontend/home">
              <h1 className="text-2xl font-bold font-serif">LegalynX</h1>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* <ThemeToggle /> */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative">
                <ProfileAvatar />
                {/* Hidden fallback for when image fails */}
                {hasValidProfilePicture() && (
                  <div
                    className="cursor-pointer w-10 h-10 rounded-full bg-gradient-to-bl from-blue-700 to-blue-300 items-center justify-center text-white text-lg absolute top-0 left-0"
                    style={{ display: "none" }}
                  >
                    {getInitials()}
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2 text-md font-bold">
                <div className="relative">
                  <ProfileAvatar />
                  {/* Hidden fallback for dropdown */}
                  {hasValidProfilePicture() && (
                    <div
                      className="cursor-pointer w-10 h-10 rounded-full bg-gradient-to-bl from-blue-700 to-blue-300 items-center justify-center text-white text-lg absolute top-0 left-0"
                      style={{ display: "none" }}
                    >
                      {getInitials()}
                    </div>
                  )}
                </div>
                <span className="flex flex-col">
                  <span>{getDisplayName()}</span>
                  <p className="border border-tertiary rounded-md px-1 py-1 text-xs text-muted-foreground w-fit">
                    {getSubscriptionStatus()}
                  </p>
                </span>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />
              <Link href="/frontend/settings" className="cursor-pointer">
                <DropdownMenuItem className="cursor-pointer p-2 px-3">
                  <Settings className="w-4 h-4" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <Link
                href="/frontend/settings?tab=subscription"
                className="cursor-pointer"
              >
                <DropdownMenuItem className="cursor-pointer p-2 px-3">
                  <GoGift className="w-4 h-4" />
                  Manage Subscription
                </DropdownMenuItem>
              </Link>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer p-2 px-3"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
