"use client";
import { ArrowUp, Menu } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "../../img/legalynxlogo.png";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/app/frontend/components/ui/button";

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 z-60">
      <div className="flex items-center justify-between ">
        {/* Logo Section */}
        <div className="flex items-center space-x-1">
          <Image src={logo} alt="LegalynX" width={60} height={60} />
          <div>
            <Link href="/">
              <h1 className="text-2xl font-bold font-serif text-foreground">
                LegalynX
              </h1>
            </Link>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-8 text-sm text-muted-foreground">
            <Link href="/frontend/pricing">
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Pricing
              </div>
            </Link>

            <Link href="/frontend/contact">
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Contact
              </div>
            </Link>

            <span className="flex items-center gap-4">
              <Link href="/frontend/login">
                <Button
                  variant="outline"
                  className="cursor-pointer hover:brightness-110 transition-all duration-300 border-none text-foreground font-bold px-4 py-3 rounded-full"
                >
                  Sign In
                </Button>
              </Link>
              <Link href="/frontend/register">
                <Button
                  variant="default"
                  className="cursor-pointer hover:brightness-110 transition-all duration-300 text-white font-bold px-4 py-3 rounded-full"
                >
                  Sign Up
                </Button>
              </Link>
            </span>

            <ThemeToggle />
          </div>

          {/* Mobile Menu Button and Theme Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <ArrowUp className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "max-h-96 opacity-100 transform translate-y-0"
            : "max-h-0 opacity-0 transform -translate-y-4"
        }`}
      >
        <div className="p-4 pb-6 pt-2 rounded-xl shadow-2xl">
          {/* Navigation Links */}
          <div className="space-y-4">
            {/* Pricing Link */}
            <Link href="/frontend/pricing" onClick={closeMobileMenu}>
              <div className="flex items-center gap-3 p-4 rounded-lg transition-colors cursor-pointer">
                <span className="text-lg font-medium text-muted-foreground">
                  Pricing
                </span>
              </div>
            </Link>
          </div>

          {/* Sign In Button - Pushed to bottom */}
          <div className="mt-auto flex flex-col gap-4">
            <Link href="/frontend/login" onClick={closeMobileMenu}>
                <Button
                  variant="outline"
                  className="cursor-pointer hover:brightness-110 transition-all duration-300 text-foreground font-bold px-4 py-6 rounded-full w-full text-lg"
                >
                  Sign In
                </Button>
            </Link>
            <Link href="/frontend/register" onClick={closeMobileMenu}>
              <Button
                  variant="default"
                  className="cursor-pointer hover:brightness-110 transition-all duration-300 text-white font-bold px-4 py-6 rounded-full w-full text-lg"
                >
                  Sign Up
                </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
