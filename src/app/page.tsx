"use client";

import React, { useState, useEffect } from "react";
import { Zap, Shield, Clock, Users, Folder } from "lucide-react";
import Header from "./frontend/components/layout/Header";
import BlurText from "./frontend/components/reactbits/BlurText";
import Image from "next/image";
import heroImg from "./frontend/img/legalynxlogo.png";
import Link from "next/link";
import { useTheme } from "next-themes";
import LightRays from "./frontend/components/reactbits/LightRays";
import SpotlightCard from "./frontend/components/reactbits/SpotlightCard";
import { BsFillLightningFill, BsFillShieldLockFill, BsFolderFill } from "react-icons/bs";
import AnimatedContent from "./frontend/components/reactbits/AnimatedContent";
import CountUp from "./frontend/components/reactbits/CountUp";

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { theme } = useTheme();
  const [windowWidth, setWindowWidth] = useState(0); 
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary/10 backdrop-blur-md shadow-md fixed top-0 left-0 right-0 w-full z-60" style={{ transform: 'translateZ(0)', willChange: 'transform' }}>
        <Header />
      </header>
      
      {/* Hero Section */}
      <section className="bg-primary relative overflow-hidden ">
        {/* Background light rays */}
        {windowWidth > 768 ? (
        <LightRays
                raysOrigin="top-center"
                raysColor="#C7EDE4"
                raysSpeed={1.5}
                lightSpread={0.8}
                rayLength={0.5}
                followMouse={true}
                mouseInfluence={0.1}
                noiseAmount={0.1}
                distortion={0.05}
                className="is-background"
              />
        ) : (
          <LightRays
                raysOrigin="top-center"
                raysColor="#C7EDE4"
                raysSpeed={1.5}
                lightSpread={0.8}
                rayLength={1.5}
                followMouse={true}
                mouseInfluence={0.1}
                noiseAmount={0.1}
                distortion={0.05}
                className="is-background"
              />
        )}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-30 pb-10 md:pt-40 md:pb-32">
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
                  <button className="px-6 py-3 text-lg rounded-full font-semibold bg-foreground text-primary shadow-lg hover:bg-foreground/90 transition-all duration-300 transform cursor-pointer">
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
        <AnimatedContent
          distance={100}
          direction="vertical"
          reverse={false}
          duration={1}
          initialOpacity={0}
          animateOpacity
          scale={1}
          threshold={0.2}
          onComplete={() => {
            console.log("Animation completed");
          }}
        >
          <div className="flex flex-col items-center text-center mb-20">
            <h3 className="text-3xl lg:text-5xl font-bold font-serif text-foreground mb-6">
              Powerful Features for Legal Excellence
            </h3>
            <p className="text-md tex text-muted-foreground max-w-3xl mx-4">
              Our AI-powered platform combines cutting-edge technology with
              legal expertise to deliver unmatched document analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            <SpotlightCard className="group bg-gradient-to-tl via-blue/10 from-blue/40 to-primary rounded-2xl p-8 mx-4 md:mx-0 transition-all duration-300 cursor-default relative z-10"
              spotlightColor="rgba(46, 46, 255, 0.25)"
            >
              <BsFillShieldLockFill className="w-40 h-40 text-blue absolute -bottom-10 right-0 opacity-20 -z-10" />
              <h4 className="text-2xl mb-2 font-bold text-foreground">
                Privacy Focused
              </h4>
              <p className="text-muted-foreground text-md leading-relaxed">
                All documents uploaded are stored in a secure, private
                environment not shared to any third parties nor used to train
                data.
              </p>
            </SpotlightCard>

            <SpotlightCard className="group bg-gradient-to-tl via-blue/10 from-blue/40 p-8 mx-4 md:mx-0  transition-all duration-300 cursor-default relative z-10"
              spotlightColor="rgba(46, 46, 255, 0.25)"
            >
              <BsFolderFill className="w-40 h-40 text-blue absolute -bottom-10 right-0 opacity-20 -z-10" />
              <h4 className="text-2xl mb-2 font-bold text-foreground">
                File Management
              </h4>
              <p className="text-muted-foreground text-md leading-relaxed">
                Smart file management and auto-rename feature to help organize your documents efficiently. 
              </p>
            </SpotlightCard>

            <SpotlightCard className="group bg-gradient-to-tl via-blue/10 from-blue/40 rounded-2xl p-8 mx-4 md:mx-0 transition-all duration-300 cursor-default relative z-10"
              spotlightColor="rgba(46, 46, 255, 0.25)"
            >
              <BsFillLightningFill className="w-40 h-40 text-blue absolute -bottom-10 right-0 opacity-20 -z-10" />

              <h4 className="text-2xl mb-2 font-bold text-foreground">
                Swift Resolution
              </h4>
              <p className="text-muted-foreground text-md leading-relaxed">
                Delivers accurate answers instantly, cutting legal research and review from hours to minutes.
              </p>
            </SpotlightCard>
          </div>
        </AnimatedContent>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
        <AnimatedContent
          distance={100}
          direction="vertical"
          reverse={false}
          duration={1}
          initialOpacity={0}
          animateOpacity
          scale={1}
          threshold={0.2}
          onComplete={() => {
            console.log("Animation completed");
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mx-8 md:mx-0">
            <div>
              <h3 className="text-3xl font-bold font-serif text-foreground mb-8">
                Why Professionals Choose LegalynX?
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className=" p-2 rounded-lg">
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
                  <div className="p-2 rounded-lg">
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
                  <div className="p-2 rounded-lg">
                    <Users className="w-6 h-6 text-yellow" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">
                      24/7 Support
                    </h4>
                    <p className="text-muted-foreground">
                      24/7 Support for all your legal needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-tertiary rounded-3xl p-8 border border-tertiary">
              <h4 className="text-2xl font-bold text-foreground mb-8">
                Performance Metrics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-2">
                  <CountUp from={0} to={99} duration={1} separator="," direction="up" className="count-up text" />
                  %
                  </div>
                  <div className="text-muted-foreground">Extraction Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    <CountUp from={0} to={80} duration={1} separator="," direction="up" className="count-up text" />
                    %
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
          </AnimatedContent>
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
                <p>Powered by GPT-5-nano</p>
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
