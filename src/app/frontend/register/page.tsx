"use client";

import React, { useState, Suspense } from "react";
import Header from "../components/layout/Header";
import { Button } from "@/app/frontend/components/ui/button";
import { Input } from "@/app/frontend/components/ui/input";
import { Progress } from "@/app/frontend/components/ui/progress";
import Link from "next/link";
import { Checkbox } from "@/app/frontend/components/ui/checkbox";
import { toast, Toaster } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import logo from "../img/legalynxlogo.png";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { GoEye, GoEyeClosed } from "react-icons/go";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const calculatePasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Determine strength level
    if (score <= 2) {
      return {
        strength: (score / 6) * 100,
        label: "Weak",
        color: "bg-red-500",
      };
    } else if (score <= 4) {
      return {
        strength: (score / 6) * 100,
        label: "Medium",
        color: "bg-yellow-500",
      };
    } else if (score <= 5) {
      return {
        strength: (score / 6) * 100,
        label: "Strong",
        color: "bg-green-400",
      };
    } else {
      return {
        strength: (score / 6) * 100,
        label: "Very Strong",
        color: "bg-green-500",
      };
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const validatePassword = (password: string) => {
    return formData.password === formData.confirmPassword;
  };

  const emailValidation = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (formData.email === "" || formData.password === "") {
      toast.error("Please fill in all fields");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    if (!formData.acceptTerms) {
      toast.error("You must accept the terms and conditions");
      return false;
    }
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, acceptTerms: checked });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // Store form data and return URL in sessionStorage for later use
      sessionStorage.setItem(
        "registrationData",
        JSON.stringify({
          email: formData.email,
          password: formData.password,
          returnUrl: returnUrl,
        })
      );

      const response = await fetch("/backend/api/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/frontend/register/verification");
      } else {
        toast.error(data.error || "Failed to send verification email");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-primary/10 backdrop-blur-md shadow-md fixed top-0 w-full z-60">
        <Header />
      </header>

      <main className="flex flex-col md:flex-row-reverse w-full h-full">
  

        <div className="flex flex-col items-center md:items-start mx-0 w-full md:w-1/2 md:py-10 md:px-6 justify-center gap-2 overflow-y-auto">
          <div className="md:hidden mt-20 flex bg-gradient-to-bl from-blue/0 to-blue/20 items-center mb-10 pr-10 justify-center w-full md:w-1/2 gap-2 relative">
            <Image
                src={logo}
                alt="Login"
                width={100}
                height={100}
                className="fade-gradient"
              />
            <p className="text-muted-foreground">Linking you to legal clarity</p>
          </div>

          <div className="w-full md:w-md flex flex-col md:border border-tertiary rounded-lg md:shadow-sm items-start gap-2 mx-0 md:mx-auto pt-0 md:pt-10 p-10 md:mt-20">
            <span>
              <h1 className="text-4xl font-bold font-serif">Sign Up</h1>
              <p className="text-muted-foreground mb-4">
                Create your account to get started
              </p>
            </span>

            <div className="flex flex-col items-start justify-center gap-4 w-full">
              <span className="flex flex-col items-start gap-2 justify-start w-full">
                <p className="text-sm text-muted-foreground">Email address</p>
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className={
                    formData.email && !emailValidation(formData.email)
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }
                />
                {formData.email && !emailValidation(formData.email) && (
                  <p className="text-red-500 text-xs">
                    Must be a valid email address
                  </p>
                )}
              </span>
              <span className="flex flex-col items-start gap-2 justify-start w-full">
                <div className="relative w-full">
                  <p className="text-sm text-muted-foreground">Password</p>
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 bottom-1/12 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <GoEyeClosed size={15} /> : <GoEye size={15} />}
                  </button>                  
                </div>
                {formData.password && (
                  <div className="w-full space-y-2">
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
                            : passwordStrength.label === "Strong"
                            ? "text-green-400"
                            : "text-green-500"
                        }`}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </span>

              <span className="flex flex-col items-start gap-2 justify-start w-full">
                <div className="relative w-full">
                  <p className="text-sm text-muted-foreground">
                    Confirm Password
                  </p>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 bottom-1/12 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <GoEyeClosed size={15} /> : <GoEye size={15} />}
                  </button>
                </div>
               
                {formData.confirmPassword &&
                  !validatePassword(formData.confirmPassword) && (
                    <p className="text-destructive text-xs">
                      Passwords do not match
                    </p>
                  )}
              </span>

              <span className="text-sm text-muted-foreground flex flex-row justify-start gap-1">
                <Checkbox
                  className="w-4 h-4 mr-2"
                  checked={formData.acceptTerms}
                  onCheckedChange={handleCheckboxChange}
                />
                <p className="text-xs text-muted-foreground">
                  By creating your account, you agree to the processing of your
                  personal data by LegalynX as described in the{" "}
                  <Link
                    href="/frontend/privacy-policy"
                    className="cursor-pointer underline text-blue-600 hover:text-blue-600"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </span>
              <Button
                className="w-full cursor-pointer bg-blue-600 text-white"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Sign Up"
                )}
              </Button>

              <span className="text-sm text-muted-foreground">
                <Link
                  href="/frontend/login"
                  className="cursor-pointer hover:text-blue-600"
                >
                  I already have an account
                </Link>
              </span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col bg-gradient-to-bl from-blue/0 to-blue/20 border-l border-tertiary shadow-md border items-center justify-center h-full w-full md:w-1/2 gap-2 relative">
          <Image
            src={logo}
            alt="Login"
            width={600}
            height={500}
            className="fade-gradient"
          />
          <p className="text-2xl mx-auto text-center absolute bottom-20 text-muted-foreground">
            Linking you to legal clarity
          </p>
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Register() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}

export default Register;
