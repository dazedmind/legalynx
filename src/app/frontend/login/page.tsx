"use client";
import React, { useEffect, useState, Suspense } from "react";
import Header from "../components/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/AuthContext";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, Toaster } from "sonner";
import logo from "../img/legalynxlogo.png";
import Image from "next/image";
import { Loader2 } from "lucide-react";


function LoginContent() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const emailValidation = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    const response = await fetch("/backend/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      // Use auth context to set authentication
      login(data.token, data.user);
      // Redirect to returnUrl if provided, otherwise go to home
      router.push(returnUrl || "/frontend/home");
    } else {
      toast.error(data.message || "Login failed");
    }
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-primary backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <Header />
      </header>

      <main className="flex flex-col md:flex-row-reverse w-full h-[calc(100vh-var(--header-height,64px))]">
        <div className="flex flex-col items-center md:items-start mx-0 w-full md:w-1/2 px-10 py-20 md:py-10 justify-center gap-2 overflow-y-auto">
          <div className="w-full flex flex-col items-start md:pl-20 gap-2">
            <span>
              <h1 className="text-4xl font-bold font-serif">Sign In</h1>
              <p className="text-muted-foreground mb-4">
                Welcome back to LegalynX
              </p>
            </span>

            <div className="flex flex-col items-start justify-center gap-4 w-full md:not-first:w-2/3">
              <span className="flex flex-col items-start gap-2 justify-start w-full">
                <p className="text-sm text-muted-foreground">Email address</p>
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  onKeyDown={handleKeyPress}
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
                <p className="text-sm text-muted-foreground">Password</p>
                <Input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyDown={handleKeyPress}
                />
              </span>

              <span className="text-sm text-muted-foreground">
                Forgot Password?
              </span>
              <Button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full cursor-pointer bg-blue-600 text-white"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>

              <span className="text-sm text-muted-foreground">
                <Link
                  href={
                    returnUrl ? `/frontend/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/frontend/register"
                  }
                  className="cursor-pointer hover:text-blue-600"
                >
                  I don't have an account yet
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

function Login() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

export default Login;
