"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "../components/layout/Header";
import InputField from "../components/ui/InputField";
import { Button } from "@/app/frontend/components/ui/button";
import { GoEye, GoEyeClosed } from "react-icons/go";
import { Toaster, toast } from "sonner";
import { AlertCircle, Check, CheckCircle, Unlink } from "lucide-react";
import { Input } from "../components/ui/input";

// Separate component for the form content that uses useSearchParams
const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Calculate password strength (same as register page)
  const calculatePasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Determine strength level
    if (score <= 2) {
      return {
        strength: (score / 5) * 100,
        label: "Weak",
        color: "bg-red-500",
      };
    } else if (score <= 4) {
      return {
        strength: (score / 5) * 100,
        label: "Medium",
        color: "bg-yellow-500",
      };
    } else {
      return {
        strength: (score / 5) * 100,
        label: "Strong",
        color: "bg-green-500",
      };
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.newPassword);

  const getPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[^A-Za-z0-9]/.test(password),
    };
  };

  const passwordRequirements = getPasswordRequirements(formData.newPassword);
  const allRequirementsMet = formData.newPassword && Object.values(passwordRequirements).every(req => req);

  // Check if password meets minimum requirements
  const isPasswordValid = (password: string): boolean => {
    return password.length >= 8 &&
           /[a-z]/.test(password) &&
           /[A-Z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[^A-Za-z0-9]/.test(password);
  };

  // Handle confirm password validation
  useEffect(() => {
    if (formData.confirmPassword) {
      setPasswordsMatch(formData.newPassword === formData.confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [formData.newPassword, formData.confirmPassword]);

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        const response = await fetch("/backend/api/verify-reset-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();
        setTokenValid(result.valid);

        if (!result.valid) {
          setError(result.error || "Invalid or expired reset link");
        }
      } catch (error) {
        console.error("Token verification error:", error);
        setTokenValid(false);
        setError("Failed to verify reset link");
      }
    };

    verifyToken();
  }, [token]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) setError("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!formData.newPassword || !formData.confirmPassword) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    if (!isPasswordValid(formData.newPassword)) {
      setError("Password must be at least 8 characters and contain uppercase, lowercase, number, and special character");
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/backend/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success("Password reset successfully!");
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/frontend/login");
        }, 3000);
      } else {
        setError(result.error || "Failed to reset password");
        toast.error(result.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setError("An error occurred. Please try again.");
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while verifying token
  if (tokenValid === null) {
    return (
      <div className="w-80 md:w-96 p-8 rounded-xl bg-primary text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
        <p className="text-primary-foreground">Verifying reset link...</p>
      </div>
    );
  }

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="w-80 md:w-96 p-8 rounded-xl mt-16 border border-tertiary bg-primary text-center space-y-3">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
          <Unlink size={24} className="text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-destructive">Invalid Reset Link</h2>
        <p className="text-muted-foreground text-sm">
          {"This password reset link is invalid or has expired. Please request a new one."}
        </p>
        <button
          onClick={() => router.push("/frontend/login")}
          className="px-6 py-2 bg-blue hover:brightness-105 text-white rounded-lg font-semibold cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="w-80 md:w-96 p-8 rounded-xl mt-16 border border-tertiary bg-primary text-center space-y-3">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
          <Check size={32} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-green-600">Password Reset Successful!</h2>
        <p className="text-muted-foreground text-sm">
          Your password has been successfully updated. You can now log in with your new password.
        </p>
        <p className="text-blue font-semibold text-sm">
          Redirecting to login page in 3 seconds...
        </p>
        <button
          onClick={() => router.push("/frontend/login")}
          className="px-6 py-2 bg-blue hover:brightness-105 text-white rounded-lg font-semibold cursor-pointer"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Main reset password form
  return (
    <div className="w-80 md:w-96 m-5 p-8 h-fit rounded-xl bg-primary border border-tertiary shadow-sm relative z-10">
      {/* Title */}
      <div className="flex flex-col justify-center gap-2 items-center pt-2 mb-4">
        <h1 className="text-3xl font-serif font-bold text-blue">Reset Password</h1>
        <p className="text-foreground-muted text-sm text-center">
          Enter your new password below
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* New Password */}
        <div className="relative space-y-4">
          <label className="text-sm font-medium text-foreground">New Password</label>
          <Input
            type={showNewPassword ? "text" : "password"}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            className="w-full pr-20"
            id="new_password"
            placeholder="Enter your new password"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-2 -bottom-1 -translate-y-1/2 hover:bg-foreground/10 p-1 rounded text-gray-500 hover:text-gray-700 cursor-pointer"
            >
            {showNewPassword ? <GoEyeClosed size={15} /> : <GoEye size={15} />}
          </button>
        </div>

        {/* Password Strength Progress Bar */}
        {formData.newPassword && (
          <div className="flex items-center gap-2 w-full">
            <div className="space-y-2 w-full">
              <div className="relative w-full h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                  style={{ width: `${passwordStrength.strength}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span
                  className={`text-xs font-medium ${
                    passwordStrength.label === "Weak"
                      ? "text-red-500"
                      : passwordStrength.label === "Medium"
                      ? "text-yellow-600"
                      : "text-green-500"
                  }`}
                >
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          

            {formData.newPassword && !allRequirementsMet && (
            <div className="-translate-y-1/2 group z-100">
              <AlertCircle size={16} className={` ${passwordStrength.label === "Weak" ? "text-red-500" : passwordStrength.label === "Medium" ? "text-yellow-600" : passwordStrength.label === "Strong" ? "text-green-400" : "text-green-500"}`} />
              <div className="absolute right-0 top-6 w-56 p-3 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="text-xs font-medium mb-2">Password must contain:</p>
                <ul className="space-y-1 text-xs">
                  <li className={passwordRequirements.minLength ? "text-green-500" : "text-muted-foreground"}>
                    • At least 8 characters
                  </li>
                  <li className={passwordRequirements.hasLowercase ? "text-green-500" : "text-muted-foreground"}>
                    • Lowercase letter (a-z)
                  </li>
                  <li className={passwordRequirements.hasUppercase ? "text-green-500" : "text-muted-foreground"}>
                    • Uppercase letter (A-Z)
                  </li>
                  <li className={passwordRequirements.hasNumber ? "text-green-500" : "text-muted-foreground"}>
                    • Number (0-9)
                  </li>
                  <li className={passwordRequirements.hasSymbol ? "text-green-500" : "text-muted-foreground"}>
                    • Special character (!@#$...)
                  </li>
                </ul>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Confirm Password */}
        <div className="relative">
          <label className="text-sm font-medium text-foreground">Confirm New Password</label>
          <Input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full"
            id="confirm_new_password"
            placeholder="Confirm your new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-2 -bottom-1 -translate-y-1/2 hover:bg-foreground/10 p-1 rounded text-gray-500 hover:text-gray-700 cursor-pointer"
            >
            {showConfirmPassword ? <GoEyeClosed size={15} /> : <GoEye size={15} />}
          </button>
        </div>

        {/* Password Match Indicator */}
        {formData.confirmPassword && (
          <div className={`flex px-2 items-center text-xs ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
            <span className="mr-2">{passwordsMatch ? "" : "Passwords do not match"}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/50 border border-destructive rounded-lg p-3">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div>
          <Button
            type="submit"
            disabled={isLoading || !isPasswordValid(formData.newPassword) || !passwordsMatch}
            className={`w-full h-10 mt-2 rounded-lg bg-gradient-to-r from-[#1a3aa7] to-[#468aff] hover:brightness-120 transition-all duration-300 font-bold text-md text-white ${
              (isLoading || !isPasswordValid(formData.newPassword) || !passwordsMatch) 
                ? 'opacity-70 cursor-not-allowed' 
                : ''
            }`}
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </Button>
        </div>

        {/* Back to Login */}
        <div className="text-center pt-4 cursor-pointer">
          <button
            type="button"
            onClick={() => router.push("/frontend/login")}
            className="text-blue font-bold text-sm hover:underline cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
};

// Loading component for Suspense fallback
const LoadingResetForm = () => (
  <div className="w-80 md:w-96 p-8 rounded-xl bg-primary text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue mx-auto mb-4"></div>
    <p className="text-primary-foreground">Loading...</p>
  </div>
);

// Main page component
const ResetPasswordPage = () => {
  return (
    <div className="font-Inter h-screen w-screen bg-primary overflow-hidden relative">      
      <header className="bg-primary backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <Header />
      </header>

      <main className="flex flex-col justify-center mt-15 items-center relative z-10">
        <Suspense fallback={<LoadingResetForm />}>
          <ResetPasswordForm />
        </Suspense>
      </main>

      <Toaster />
    </div>
  );
};

export default ResetPasswordPage;