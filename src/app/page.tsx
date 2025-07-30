'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Brain, Zap, Shield, Clock, Users, ArrowRight, Check, Star } from 'lucide-react';
import { apiService, handleApiError, SystemStatus, UploadResponse } from './frontend/lib/api';
import { Button } from '@/components/ui/button';
import Header from './frontend/components/Header';
import BlurText from './frontend/components/reactbits/BlurText';
import Image from 'next/image';
import heroImg from './frontend/img/document-hero.png'
import Link from 'next/link';

export default function Home() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
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
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <Header />
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-30 pb-32">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="flex-1 text-center lg:text-left">
   
              <BlurText 
                text="LegalynX" 
                className="text-5xl lg:text-7xl font-bold font-serif  mb-2" 
              />
              
              <h2 className="text-1xl lg:text-2xl text-gray-600 mb-4 font-light">
                Linking you to{' '}
                <span className="text-blue font-semibold">legal clarity</span>
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

      {/* Social Proof */}
      <section className="py-16 bg-white border-t border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 mb-8">Trusted by leading legal professionals worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
            <div className="flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-400">BigLaw Corp</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-400">Legal Partners</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-400">Justice & Co</div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-2xl font-bold text-gray-400">Law Firm Plus</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Powerful Features for Legal Excellence
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform combines cutting-edge technology with legal expertise 
              to deliver unmatched document analysis capabilities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="bg-yellow w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Smart PDF Processing</h4>
              <p className="text-gray-600 text-lg leading-relaxed">
                Advanced OCR and text extraction technology automatically detects document types 
                and processes both scanned and digital PDFs with 99.5% accuracy.
              </p>
            </div>
            
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200">
              <div className="bg-yellow w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Hybrid AI Retrieval</h4>
              <p className="text-gray-600 text-lg leading-relaxed">
                Combines vector search, keyword matching (BM25), and semantic chunking 
                for optimal information retrieval and contextual understanding.
              </p>
            </div>
            
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
              <div className="bg-yellow w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Advanced Analysis</h4>
              <p className="text-gray-600 text-lg leading-relaxed">
                Query analysis with reranking and detailed source attribution provides 
                transparent, reliable AI responses with legal-grade accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-4xl font-bold text-gray-900 mb-8">
                Why Legal Professionals Choose LegalynX
              </h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow/20 p-2 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">80% Time Reduction</h4>
                    <p className="text-gray-600">Dramatically reduce document review time from hours to minutes with AI-powered analysis.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-yellow/20 p-2 rounded-lg">
                    <Shield className="w-6 h-6 text-yellow" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Enterprise Security</h4>
                    <p className="text-gray-600">Bank-grade encryption and compliance with legal industry security standards.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-yellow/20 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-yellow" />
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Team Collaboration</h4>
                    <p className="text-gray-600">Seamless collaboration tools designed for legal teams of all sizes.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h4 className="text-2xl font-bold text-gray-900 mb-4">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">99.5%</div>
                    <div className="text-gray-600">Accuracy Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">80%</div>
                    <div className="text-gray-600">Time Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">500+</div>
                    <div className="text-gray-600">Legal Teams</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                    <div className="text-gray-600">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-gradient-to-r from-blue to-dark-blue">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold text-white mb-16">What Legal Professionals Say</h3>
          
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20">
            <div className="mb-8">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-xl lg:text-2xl text-white font-light leading-relaxed">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
            </div>
            
            <div className="text-white">
              <div className="font-semibold text-lg">{testimonials[currentTestimonial].author}</div>
              <div className="text-blue-200">{testimonials[currentTestimonial].role}</div>
              <div className="text-blue-300 text-sm">{testimonials[currentTestimonial].company}</div>
            </div>
          </div>
          
          <div className="flex justify-center mt-8 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentTestimonial ? 'bg-white' : 'bg-white/40'
                }`}
                onClick={() => setCurrentTestimonial(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Legal Workflow?
          </h3>
          <p className="text-xl text-gray-300 mb-10">
            Join hundreds of legal professionals who've already streamlined their document analysis process.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/frontend/pricing">
              <Button className="px-10 py-6 text-lg  w-fit font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                Start Free Trial
              </Button>
            </Link>
            <Button variant="outline" className="px-10 py-6 text-lg w-fit font-semibold border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-300 cursor-pointer">
              Contact Sales
            </Button>
          </div>
          
          <p className="text-gray-400 mt-6 text-sm">
            No credit card and subscription required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <h4 className="text-2xl font-bold text-gray-900 mb-4">LegalynX</h4>
              <p className="text-gray-600 mb-4 max-w-md">
                Empowering legal professionals with AI-driven document analysis 
                and intelligent insights for better decision-making.
              </p>
              <div className="text-sm text-gray-500">
                <p>Powered by GPT 4.1 mini</p>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-900 mb-4">Product</h5>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/features" className="hover:text-blue-600 transition-colors">Features</Link></li>
                <li><Link href="/frontend/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
                <li><Link href="/security" className="hover:text-blue-600 transition-colors">Security</Link></li>
                <li><Link href="/integrations" className="hover:text-blue-600 transition-colors">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-gray-900 mb-4">Company</h5>
              <ul className="space-y-2 text-gray-600">
                <li><Link href="/about" className="hover:text-blue-600 transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                <li><Link href="/frontend/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm">
              © 2024 LegalynX. All rights reserved.
            </div>
            <div className="text-sm text-gray-500 mt-4 md:mt-0">
              System Developers: <span className='text-blue-600 hover:text-blue-700 transition-colors'>Git Merge</span> 
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}