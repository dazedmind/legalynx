"use client";

import React, { useState, useEffect } from "react";
import {  ArrowUp, Upload, Sparkles, CheckCircle, Plus, Minus } from "lucide-react";
import Header from "./frontend/components/layout/Header";
import BlurText from "./frontend/components/reactbits/BlurText";
import Image from "next/image";
import voiceMode from "./frontend/img/voice-mode.png";
import voiceModeDark from "./frontend/img/voice-mode-dark.png";
import Link from "next/link";
import { useTheme } from "next-themes";
import LightRays from "./frontend/components/reactbits/LightRays";
import SpotlightCard from "./frontend/components/reactbits/SpotlightCard";
import { BsFillLightningFill, BsFillShieldLockFill, BsFolderFill } from "react-icons/bs";
import AnimatedContent from "./frontend/components/reactbits/AnimatedContent";
import TypingAnimation from "./frontend/components/layout/TypingAnimation";
import { HiOutlineChatBubbleBottomCenter } from "react-icons/hi2";
import { GoBriefcase, GoLaw, GoMortarBoard} from "react-icons/go";

export default function Home() {
  const { theme } = useTheme();
  const [windowWidth, setWindowWidth] = useState(0); 
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showDevelopersModal, setShowDevelopersModal] = useState(false);
  const [showButtonToTop, setShowButtonToTop] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [onTop, setOnTop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // Set initial width
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        setOnTop(false);
      } else {
        setOnTop(true);
      }
    });
  }, []);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={` fixed top-0 left-0 right-0 w-auto z-60 transition-all duration-300 ${onTop ? 'bg-none backdrop-blur-none shadow-none' : 'm-4 mx-4 md:mx-24 rounded-lg bg-primary/10 backdrop-blur-md shadow-md'}`} style={{ transform: 'translateZ(0)', willChange: 'transform' }}>
        <Header />
      </header>
      
      {/* Hero Section */}
      <section className="bg-primary relative overflow-hidden ">
        {/* Background light rays */}
        {windowWidth > 768 && theme === "dark" ? (
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
                raysColor="#F0FFFF"
                raysSpeed={1.5}
                lightSpread={0.8}
                rayLength={0.5}
                followMouse={true}
                mouseInfluence={0.1}
                noiseAmount={0.1}
                distortion={0.05}
                className="is-background"
              />
        )}

        {/* TOP BLUE GRADIENT */}
        <div className="bg-gradient-to-b from-blue/30 to-transparent w-full h-1/3 rounded-3xl rounded-tr-none rounded-tl-none absolute top-0 left-0"></div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-30 pb-10 md:pb-32">
          <div className="flex flex-col items-center justify-center gap-10 md:gap-16 pt-40">
            <div className="flex flex-col gap-4 text-center items-center lg:text-left">
              <BlurText
                text="Linking You to Legal Clarity"
                className="text-5xl lg:text-7xl text-center justify-center font-bold text-foreground font-serif  md:mt-0  mb-1"
              />
              <p className="text-muted-foreground text-md">
                Your trusted AI-powered legal assistant for fast, accurate document analysis.
              </p>
              
              <div className="flex flex-row gap-4 justify-center lg:justify-start">
                <Link href="/frontend/register">
                  <button className="px-6 py-3 text-md md:text-lg rounded-full font-semibold bg-foreground text-primary shadow-lg hover:bg-foreground/90 transition-all duration-300 transform cursor-pointer">
                    Try for Free
                  </button>
                </Link>

                <Link href="/frontend/pricing">
                  <button className="px-6 py-3 text-md md:text-lg border border-foreground text-foreground rounded-full transition-all ease-in-out duration-300 transform cursor-pointer">
                    View Pricing
                  </button>
                </Link>
              </div>
             
            </div>
            <div className="flex flex-col items-end md:relative" id="hero-image">
              {theme === "dark" ? (
                <Image
                  src={voiceModeDark}
                  alt="LegalynX Logo"
                  width={800}
                  height={800}
                  className="fade-gradient border-2 border-tertiary p-4 rounded-2xl"
                />
              ) : (
              <Image
                src={voiceMode}
                alt="LegalynX Logo"
                width={800}
                height={800}
                className="fade-gradient border-2 border-tertiary p-4 rounded-2xl"
              />
              )}
              <span className="flex flex-col items-end gap-5">
                {/* PROMPT SAMPLE */}
                <div className="flex items-center gap-2">
                  <p className={`md:absolute top-54 -right-16 bg-blue p-4 rounded-2xl rounded-br-sm text-md text-white`}>
                    <TypingAnimation text="What's the ruling on Devie Fuertes?" delay={40}/>
                  </p>
                  <button className="md:absolute top-56 -right-30 p-2 rounded-full bg-blue cursor-pointer" onClick={() => setShowAnswer(true)}>
                    <ArrowUp className="w-6 h-6 text-white" />
                  </button>
                </div>
   
  
                {/* ANSWER SAMPLE */}
                {showAnswer && (
                <>
                <p className="md:absolute -bottom-20 -left-10 max-w-3xl bg-primary text-md text-foreground border border-tertiary text-justify p-4 rounded-2xl">
                  <TypingAnimation 
                    text={`
                      Devie Fuertes was found administratively liable for grave misconduct and suspended from service for six (6) months without pay. The Court held that Fuertes' actions constituted a serious breach of ethical standards expected of public officers. The decision emphasized that government employees must uphold integrity and fairness in all official dealings.
                      \n
                      \n
                      Supporting evidence is detailed in the decision's dispositive portion [Page 12, Section V], where the Court affirmed the suspension and directed the Civil Service Commission to monitor compliance. Would you like me to explain this in more detail?`}
                    delay={5} />
                </p>
                </>
                )}
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}

      <section className="pb-24 bg-primary">
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
          <div className="flex flex-col items-center text-center mb-5 md:mb-20">
            <h3 className="text-3xl lg:text-5xl font-bold font-serif text-foreground mt-10 mb-6">
              Powerful Features for Legal Excellence
            </h3>
            <p className="text-md tex text-muted-foreground max-w-3xl mx-4">
              Our AI-powered platform combines cutting-edge technology with
              legal expertise to deliver unmatched document analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
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

      {/* How It Works Section */}
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
      <section className="py-12 m-6 md:m-12 rounded-xl bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl lg:text-5xl font-bold font-serif text-foreground mb-6">
                How It Works
              </h3>
              <p className="text-md text-muted-foreground max-w-2xl mx-auto">
                Get started with LegalynX in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-4 md:mx-0">
              <div className="text-center">
                <div className="bg-blue/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10 text-blue" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">1. Upload Documents</h4>
                <p className="text-muted-foreground">
                  Simply drag and drop your legal documents or upload them directly to our secure platform.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <HiOutlineChatBubbleBottomCenter className="w-10 h-10 text-blue" strokeWidth={2} />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">2. Ask Questions</h4>
                <p className="text-muted-foreground">
                  Use natural language to query your documents. Our AI understands complex legal terminology.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-blue/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-blue" />
                </div>
                <h4 className="text-xl font-bold text-foreground mb-3">3. Get Instant Insights</h4>
                <p className="text-muted-foreground">
                  Receive accurate, context-aware answers with citations and references in seconds.
                </p>
              </div>
            </div>
        </div>
      </section>
      </AnimatedContent>

      {/* Use Cases Section */}
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
            <div className="text-center mb-16">
              <h3 className="text-3xl lg:text-5xl font-bold font-serif text-foreground mb-6">
                Perfect For Every Legal Professional
              </h3>
              <p className="text-md text-muted-foreground max-w-2xl mx-auto">
                Whether you're a lawyer, paralegal, or legal student, LegalynX adapts to your needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-4 md:mx-0">
              <SpotlightCard
                className="bg-tertiary border border-tertiary rounded-2xl p-8 hover:border-blue/50 transition-all duration-300"
                spotlightColor="rgba(46, 46, 255, 0.15)"
              >
                <GoLaw className="w-12 h-12 text-yellow mb-4" />
                <h4 className="text-xl font-bold text-foreground mb-3">Law Firms</h4>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow mt-0.5 flex-shrink-0" />
                    <span>Contract review and analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow mt-0.5 flex-shrink-0" />
                    <span>Case law research</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow mt-0.5 flex-shrink-0" />
                    <span>Due diligence automation</span>
                  </li>
                </ul>
              </SpotlightCard>

              <SpotlightCard
                className="bg-tertiary border border-tertiary rounded-2xl p-8 hover:border-blue/50 transition-all duration-300"
                spotlightColor="rgba(46, 46, 255, 0.15)"
              >
                <GoBriefcase className="w-12 h-12 text-yellow mb-4" />
                <h4 className="text-xl font-bold text-foreground mb-3">Corporate Legal Teams</h4>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow mt-0.5 flex-shrink-0" />
                    <span>Policy document analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow mt-0.5 flex-shrink-0" />
                    <span>Compliance monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow mt-0.5 flex-shrink-0" />
                    <span>Risk assessment</span>
                  </li>
                </ul>
              </SpotlightCard>

              <SpotlightCard
                className="bg-tertiary border border-tertiary rounded-2xl p-8 hover:border-blue/50 transition-all duration-300"
                spotlightColor="rgba(46, 46, 255, 0.15)"
              >
                <GoMortarBoard className="w-12 h-12 text-yellow mb-4" />
                <h4 className="text-xl font-bold text-foreground mb-3">Legal Students</h4>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow mt-0.5 flex-shrink-0" />
                    <span>Case study analysis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow mt-0.5 flex-shrink-0" />
                    <span>Legal research assistance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-yellow mt-0.5 flex-shrink-0" />
                    <span>Exam preparation</span>
                  </li>
                </ul>
              </SpotlightCard>
            </div>
          </AnimatedContent>
        </div>
      </section>

      {/* Stats Section */}
      {/* <section className="py-24 bg-secondary">
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
            <div className="text-center mb-16">
              <h3 className="text-3xl lg:text-5xl font-bold font-serif text-foreground mb-6">
                Trusted by Legal Professionals
              </h3>
              <p className="text-md text-muted-foreground max-w-2xl mx-auto">
                Our platform delivers measurable results
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mx-4 md:mx-0">
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-blue mb-2">99%</div>
                <p className="text-muted-foreground">Accuracy Rate</p>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-blue mb-2">80%</div>
                <p className="text-muted-foreground">Time Saved</p>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-blue mb-2">24/7</div>
                <p className="text-muted-foreground">Availability</p>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-blue mb-2">500+</div>
                <p className="text-muted-foreground">Users</p>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </section> */}

      {/* Testimonials Section */}
      {/* <section className="py-24 bg-primary">
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
            <div className="text-center mb-16">
              <h3 className="text-3xl lg:text-5xl font-bold font-serif text-foreground mb-6">
                What Our Users Say
              </h3>
              <p className="text-md text-muted-foreground max-w-2xl mx-auto">
                Hear from legal professionals who transformed their workflow
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mx-4 md:mx-0">
              <div className="bg-tertiary border border-tertiary rounded-2xl p-8 hover:border-blue/30 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "LegalynX has revolutionized how we handle document review. What used to take days now takes hours. The accuracy is impressive."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue/20 flex items-center justify-center">
                    <span className="text-blue font-semibold">MR</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Maria Rodriguez</p>
                    <p className="text-sm text-muted-foreground">Senior Attorney</p>
                  </div>
                </div>
              </div>

              <div className="bg-tertiary border border-tertiary rounded-2xl p-8 hover:border-blue/30 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "As a legal student, this tool has been invaluable for my research. It helps me understand complex cases quickly and efficiently."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue/20 flex items-center justify-center">
                    <span className="text-blue font-semibold">JC</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">James Chen</p>
                    <p className="text-sm text-muted-foreground">Law Student</p>
                  </div>
                </div>
              </div>

              <div className="bg-tertiary border border-tertiary rounded-2xl p-8 hover:border-blue/30 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "The AI-powered insights have improved our compliance monitoring significantly. It's like having an extra team member working 24/7."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue/20 flex items-center justify-center">
                    <span className="text-blue font-semibold">SP</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Sarah Parker</p>
                    <p className="text-sm text-muted-foreground">Corporate Counsel</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContent>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
 
        <div className="text-center mb-16">
              <h3 className="text-3xl lg:text-5xl font-bold font-serif text-foreground mb-6">
                Frequently Asked Questions
              </h3>
              <p className="text-md text-muted-foreground">
                Everything you need to know about LegalynX
              </p>
            </div>

          <div className="space-y-4 mx-4 md:mx-0">
              {/* FAQ 1 */}
              <div className="bg-primary border border-tertiary rounded-2xl overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
                >
                  <h4 className="text-xl font-semibold text-foreground pr-4">
                    Is my data secure and private?
                  </h4>
                  {openFaqIndex === 0 ? <Minus className="w-6 h-6 text-foreground flex-shrink-0" /> : <Plus className="w-6 h-6 text-foreground flex-shrink-0" />}

                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaqIndex === 0 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-muted-foreground px-6 pb-5">
                    Absolutely. All documents are encrypted and stored securely. We never share your data with third parties or use it for training purposes. Your privacy is our top priority.
                  </p>
                </div>
              </div>

              {/* FAQ 2 */}
              <div className="bg-primary border border-tertiary rounded-2xl overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
                >
                  <h4 className="text-xl font-semibold text-foreground pr-4">
                    What file formats are supported?
                  </h4>
                  {openFaqIndex === 1 ? <Minus className="w-6 h-6 text-foreground flex-shrink-0" /> : <Plus className="w-6 h-6 text-foreground flex-shrink-0" />}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaqIndex === 1 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-muted-foreground px-6 pb-5">
                    LegalynX supports a wide range of formats including PDF and DOCX. Our AI can process digital documents with high accuracy.
                  </p>
                </div>
              </div>

              {/* FAQ 3 */}
              <div className="bg-primary border border-tertiary rounded-2xl overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer"
                >
                  <h4 className="text-xl font-semibold text-foreground pr-4">
                    Can I cancel my subscription anytime?
                  </h4>
                  {openFaqIndex === 2 ? <Minus className="w-6 h-6 text-foreground flex-shrink-0" /> : <Plus className="w-6 h-6 text-foreground flex-shrink-0" />}
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaqIndex === 2 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-muted-foreground px-6 pb-5">
                    Yes, you can cancel your subscription at any time with no hidden fees or penalties. Your data will remain accessible during your billing period.
                  </p>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 m-6 md:m-12 rounded-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl lg:text-5xl font-bold font-serif text-white mb-6">
            Ready to Transform Your Legal Workflow?
          </h3>
          <p className="text-sm md:text-lg text-gray-300 mb-10">
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
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
              <h5 className="font-semibold text-foreground mb-4">Company</h5>
              <ul className="space-y-2 text-muted-foreground">
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
                    href="/frontend/contact"
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
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground text-sm">
              © 2025 LegalynX. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground mt-4 md:mt-0">
              System Developers:{" "}
              <button 
                onClick={() => setShowDevelopersModal(true)}
                className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer underline-offset-2 hover:underline"
              >
                Git Merge
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Developers Modal */}
      {showDevelopersModal && (
        <div 
          className={`fixed inset-0 bg-black/20  z-100 flex items-center justify-center transition-all duration-200 ease-out`}
          onClick={() => setShowDevelopersModal(false)}
        >
          <div 
            className={`bg-primary border border-tertiary rounded-md max-w-xl w-full p-6 shadow-2xl mx-4 transition-all duration-200 ease-out ${
            showDevelopersModal 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-95'
          }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-foreground">The Developers</h3>
              </span>

              <button 
                onClick={() => setShowDevelopersModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Developer 1 */}
              <div className="border border-tertiary rounded-md p-4 hover:border-blue/50 transition-colors">
                <h4 className="text-xl font-semibold text-foreground">Kristhia Cayle F. Lastra</h4>
                <p className="text-sm text-blue-600 mb-2">Backend Engineer & Documentation Lead</p>
                <p className="text-muted-foreground text-sm">
                  Specializes in the backend architecture, and system optimization. 
                  Led the development of the RAG pipeline and system documentation.
                </p>
              </div>

              {/* Developer 2 */}
              <div className="border border-tertiary rounded-md p-4 hover:border-blue/50 transition-colors">
                <h4 className="text-xl font-semibold text-foreground">John Allen Troy E. Valeña</h4>
                <p className="text-sm text-blue-600 mb-2">Full-stack Developer & UI/UX Engineer</p>
                <p className="text-muted-foreground text-sm">
                  Focuses on integration of backend to frontend, user experience, interface design. 
                  Created the modern UI components and interactive features.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      {!onTop && (
        <div className="fixed bottom-4 right-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-full cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <ArrowUp className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
