"use client";

import React, { useState, useEffect } from "react";
import { Brain, Zap, Shield, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "./frontend/components/Header";
import BlurText from "./frontend/components/reactbits/BlurText";
import Image from "next/image";
import heroImg from "./frontend/img/legalynxlogo.png";
import Link from "next/link";
import { useTheme } from "next-themes";
import LightRays from "@/components/LightRays";
import SpotlightCard from "@/components/SpotlightCard";

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { theme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-primary backdrop-blur-md shadow-sm border-b sticky top-0 z-60">
        <Header />
      </header>
      
      {/* Hero Section */}
      <section className="bg-primary relative overflow-hidden ">
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 md:pt-30 md:pb-32">
          <div className="flex flex-col-reverse lg:flex-row items-center justify-between md:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <BlurText
                text="LegalynX"
                className="text-5xl lg:text-7xl font-bold text-foreground font-serif  md:mt-0  mb-2"
              />

              <h2 className="text-1xl lg:text-2xl text-muted-foreground mb-4 font-light">
                Linking you to legal clarity
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/frontend/pricing">
                  <button className="px-6 py-3 text-lg rounded-full font-semibold bg-foreground text-primary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>

            <div className="block">
              <Image
                src={heroImg}
                alt="LegalynX Logo"
                width={400}
                height={400}
                className="fade-gradient"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h3 className="text-4xl lg:text-5xl font-bold font-serif text-foreground mb-6">
              Powerful Features for Legal Excellence
            </h3>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with
              legal expertise to deliver unmatched document analysis
              capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <SpotlightCard className="group bg-primary rounded-2xl p-8 mx-8 md:mx-0  transition-all duration-300 border border-tertiary"
              spotlightColor="rgba(255, 214, 0, 0.25)"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-foreground">
                Smart Processing
              </h4>
              <p className="text-muted-foreground text-md leading-relaxed">
                Advanced OCR and text extraction technology automatically
                detects document types and processes PDFs.
              </p>
            </SpotlightCard>

            <SpotlightCard className="group bg-primary rounded-2xl p-8 mx-8 md:mx-0 transition-all duration-300 border border-tertiary"
              spotlightColor="rgba(255, 214, 0, 0.25)"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-foreground">
                Privacy Focused
              </h4>
              <p className="text-muted-foreground text-md leading-relaxed">
                All documents uploaded are stored in a secure, private
                environment not shared to any third parties nor used to train
                data.
              </p>
            </SpotlightCard>

            <SpotlightCard className="group bg-primary rounded-2xl p-8 mx-8 md:mx-0 transition-all duration-300 border border-tertiary"
              spotlightColor="rgba(255, 214, 0, 0.25)"
            >
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-foreground">
                Swift Resolution
              </h4>
              <p className="text-muted-foreground text-md leading-relaxed">
                Delivers accurate answers instantly, cutting legal research and review from hours to minutes.
              </p>
            </SpotlightCard>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mx-8 md:mx-0">
            <div>
              <h3 className="text-3xl font-bold font-serif text-foreground mb-8">
                Why Professionals Choose LegalynX?
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow/20 p-2 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">
                      80% Time Reduction
                    </h4>
                    <p className="text-muted-foreground">
                      Dramatically reduce document review time from hours to
                      minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-yellow/20 p-2 rounded-lg">
                    <Shield className="w-6 h-6 text-yellow" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">
                      Enterprise Security
                    </h4>
                    <p className="text-muted-foreground">
                      Bank-grade encryption with legal industry security
                      standards.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-yellow/20 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-yellow" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">
                      24/7 Support
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      24/7 Support for all your legal needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-accent rounded-3xl p-8 border border-tertiary">
              <h4 className="text-2xl font-bold text-foreground mb-8">
                Performance Metrics
              </h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    80%
                  </div>
                  <div className="text-muted-foreground">Time Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow mb-2">
                    24/7
                  </div>
                  <div className="text-muted-foreground">Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl lg:text-5xl font-bold font-serif text-white mb-6">
            Ready to Transform Your Legal Workflow?
          </h3>
          <p className="text-lg text-gray-300 mb-10">
            Join hundreds of legal professionals who've already streamlined
            their document analysis process.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/frontend/register">
              <button className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                Start Free Trial
              </button>
            </Link>
          </div>

          <p className="text-gray-400 mt-6 text-sm">
            No credit card and subscription required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary border-t">
        <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h4 className="text-2xl font-serif font-bold text-foreground mb-4">
                LegalynX
              </h4>
              <p className="text-muted-foreground mb-4 max-w-md">
                Empowering legal professionals with AI-driven document analysis
                and intelligent insights for better decision-making.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Powered by GPT 5 nano</p>
              </div>
            </div>

            <div className="col-span-1">
              <h5 className="font-semibold text-foreground mb-4">Product</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link
                    href="/features"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/frontend/pricing"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h5 className="font-semibold text-foreground mb-4">Company</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link
                    href="/frontend/privacy-policy"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground text-sm">
              © 2025 LegalynX. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground mt-4 md:mt-0">
              System Developers:{" "}
              <span className="text-blue-600 hover:text-blue-700 transition-colors">
                Git Merge
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
