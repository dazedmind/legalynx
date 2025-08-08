'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Brain, Zap, Shield, Clock, Users, ArrowRight, Check, Star, Menu, X } from 'lucide-react';
import { apiService, handleApiError, SystemStatus, UploadResponse } from './frontend/lib/api';
import { Button } from '@/components/ui/button';
import Header from './frontend/components/Header';
import BlurText from './frontend/components/reactbits/BlurText';
import Image from 'next/image';
import heroImg from './frontend/img/document-hero.png'
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { PiSuitcaseSimple } from 'react-icons/pi';
import { PiNetwork } from 'react-icons/pi';
import { GoLaw } from 'react-icons/go';

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const { theme } = useTheme();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };


  const testimonials = [
    {
      quote: "LegalynX has revolutionized how we handle document analysis. What used to take hours now takes minutes.",
      author: "Sarah Johnson",
      role: "Senior Partner",
      company: "Johnson & Associates"
    },
    {
      quote: "The AI-powered insights have helped us identify critical clauses faster than ever before.",
      author: "Michael Chen",
      role: "Legal Counsel",
      company: "TechCorp Inc."
    },
    {
      quote: "Outstanding tool for document review. The accuracy and speed are remarkable.",
      author: "Emma Rodriguez",
      role: "Paralegal",
      company: "Rodriguez Law Firm"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-primary backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <Header />
      </header>

      
 {/* Mobile Menu Slide-out Panel */}
      <div className={`
        md:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white border-l border-gray-200 z-50 shadow-2xl
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
    
          <button
            onClick={toggleMobileSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close mobile menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Mobile Menu Content */}
        <div className="flex flex-col p-6 space-y-6 h-full bg-white">
          {/* Navigation Links */}
          <div className="space-y-4">
            {/* Pricing Link */}
            <Link href="/frontend/pricing" onClick={toggleMobileSidebar}>
              <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
                <span className="text-lg font-medium text-gray-900">Pricing</span>
              </div>
            </Link>

            {/* Solutions Section */}
            <div className="space-y-3">
              <div className="text-lg font-medium text-gray-900 px-4 py-2">Solutions</div>
              <div className="space-y-2">
                <div className='flex items-center gap-3 p-4 hover:bg-gray-100 rounded-lg cursor-pointer border border-gray-200 transition-colors'>
                  <span className='p-2 bg-gray-100 rounded-md'>
                    <PiSuitcaseSimple className='w-5 h-5' />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Paralegals</p>
                    <p className="text-sm text-gray-600">Streamline document review</p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-4 hover:bg-gray-100 rounded-lg cursor-pointer border border-gray-200 transition-colors'>
                  <span className='p-2 bg-gray-100 rounded-md'>
                    <PiNetwork className='w-5 h-5' />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Social Media Managers</p>
                    <p className="text-sm text-gray-600">Content compliance tools</p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-4 hover:bg-gray-100 rounded-lg cursor-pointer border border-gray-200 transition-colors'>
                  <span className='p-2 bg-gray-100 rounded-md'>
                    <GoLaw className='w-5 h-5' />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Lawyers</p>
                    <p className="text-sm text-gray-600">AI-powered legal analysis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sign In Button - Pushed to bottom */}
          <div className="mt-auto pt-6 border-t border-gray-200">
            <Link href="/frontend/login" onClick={toggleMobileSidebar}>
              <button className='w-full bg-gradient-to-tr from-yellow-500 to-yellow-300 hover:brightness-110 transition-all duration-300 text-white font-bold px-6 py-4 rounded-lg text-lg'>
                Sign In
              </button>
            </Link>
            
            {/* Additional Links */}
            <div className="mt-4 space-y-2 text-center">
              <Link href="/frontend/register" onClick={toggleMobileSidebar}>
                <p className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer">
                  Don't have an account? Sign up
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Hero Section */}
      <section className="bg-primary relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-30 pb-32">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="flex-1 text-center lg:text-left">
   
              <BlurText 
                text="LegalynX" 
                className="text-5xl lg:text-7xl font-bold text-foreground font-serif mt-30 md:mt-0  mb-2" 
              />
              
              <h2 className="text-1xl lg:text-2xl text-muted-foreground mb-4 font-light">
                Linking you to legal clarity
              </h2>
              
          
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/frontend/pricing">
                  <Button className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                    Get Started
                  </Button>
                </Link>
  
              </div>
  
            </div>
            
            <div className='hidden md:block'>
              <Image 
              src={heroImg} 
              alt="LegalynX Logo" 
              width={400} 
              height={400} 
              className='fade-gradient'
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
              Our AI-powered platform combines cutting-edge technology with legal expertise 
              to deliver unmatched document analysis capabilities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="group bg-accent rounded-2xl p-8 mx-8 md:mx-0  transition-all duration-300 border border-tertiary">
              <div className="bg-yellow w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300">
                <FileText className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Smart PDF Processing</h4>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Advanced OCR and text extraction technology automatically detects document types 
                and processes both scanned and digital PDFs with 99.5% accuracy.
              </p>
            </div>
            
            <div className="group bg-accent rounded-2xl p-8 mx-8 md:mx-0 transition-all duration-300 border border-tertiary">
              <div className="bg-yellow w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300">
                <Brain className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Hybrid AI Retrieval</h4>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Combines vector search, keyword matching (BM25), and semantic chunking 
                for optimal information retrieval and contextual understanding.
              </p>
            </div>
            
            <div className="group bg-accent rounded-2xl p-8 mx-8 md:mx-0 transition-all duration-300 border border-tertiary">
              <div className="bg-yellow w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300">
                <Zap className="w-8 h-8 text-foreground" />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Advanced Analysis</h4>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Query analysis with reranking and detailed source attribution provides 
                transparent, reliable AI responses with legal-grade accuracy.
              </p>
            </div>
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
                    <h4 className="text-xl font-semibold text-foreground mb-2">80% Time Reduction</h4>
                    <p className="text-muted-foreground">Dramatically reduce document review time from hours to minutes</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-yellow/20 p-2 rounded-lg">
                    <Shield className="w-6 h-6 text-yellow" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">Enterprise Security</h4>
                    <p className="text-muted-foreground">Bank-grade encryption with legal industry security standards.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-yellow/20 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-yellow" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-foreground mb-2">24/7 Support</h4>
                    <p className="text-muted-foreground">24/7 Support for all your legal needs.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-accent rounded-3xl p-8 border border-tertiary">
                <h4 className="text-2xl font-bold text-foreground mb-8">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">80%</div>
                    <div className="text-muted-foreground">Time Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow mb-2">24/7</div>
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
            Join hundreds of legal professionals who've already streamlined their document analysis process.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/frontend/register">
              <button className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h4 className="text-2xl font-bold text-foreground mb-4">LegalynX</h4>
              <p className="text-muted-foreground mb-4 max-w-md">
                Empowering legal professionals with AI-driven document analysis 
                and intelligent insights for better decision-making.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Powered by GPT 4.1 mini</p>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold text-foreground mb-4">Product</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/features" className="hover:text-blue-600 transition-colors">Features</Link></li>
                <li><Link href="/frontend/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-blue-600 transition-colors">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-foreground mb-4">Company</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                <li><Link href="/frontend/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground text-sm">
              © 2025 LegalynX. All rights reserved.
            </div>
            <div className="text-sm text-muted-foreground mt-4 md:mt-0">
              System Developers: <span className='text-blue-600 hover:text-blue-700 transition-colors'>Git Merge</span> 
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}