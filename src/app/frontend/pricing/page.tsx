'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import { Check, Star, Zap, Shield, Users, MessageSquare, FileText, Clock, Headphones, Crown, Sparkles } from 'lucide-react';
import BlurText from '../components/reactbits/BlurText';
import Link from 'next/link';
import { useTheme } from 'next-themes';

function EnhancedPricing() {
    const { theme } = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  const plans = [
    {
      name: "Basic",
      subtitle: "Perfect for getting started",
      price: {
        monthly: "Free",
        yearly: "Free"
      },
      originalPrice: null,
      popular: false,
      features: [
        { text: "Upload up to 5 documents", included: true },
        { text: "200 messages per session", included: true },
        { text: "Document analysis with Lynx AI", included: true },
        { text: "Temporary Chat Session", included: true },
        { text: "File Storage", included: false },
        { text: "Voice mode", included: false }
      ],
      ctaText: "Get Started Free",
      ctaStyle: `${theme === 'dark' ? 'bg-neutral-600' : 'bg-neutral-200 text-foreground'}`
    },
    {
      name: "Standard",
      subtitle: "For growing legal practices",
      price: {
        monthly: "₱129",
        yearly: "₱1,290"
      },
      originalPrice: {
        monthly: null,
        yearly: "₱1,548"
      },
      popular: true,
      features: [
        { text: "Upload up to 50 documents", included: true },
        { text: "500 messages per session", included: true },
        { text: "Document analysis with Lynx AI", included: true },
        { text: "Chat history", included: true },
        { text: "1GB file storage", included: true },
        { text: "Voice mode", included: false }
      ],
      ctaText: "Start Standard",
      ctaStyle: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
    },
    {
      name: "Premium",
      subtitle: "For professionals",
      price: {
        monthly: "₱249",
        yearly: "₱2,490"
      },
      originalPrice: {
        monthly: null,
        yearly: "₱2,988"
      },
      popular: false,
      features: [
        { text: "Upload unlimited documents", included: true },
        { text: "Unlimited messages", included: true },
        { text: "Document analysis with Lynx AI", included: true },
        { text: "Chat history", included: true },
        { text: "10GB file storage", included: true },
        { text: "Voice mode", included: true },
      ],
      ctaText: "Go Premium",
      ctaStyle: "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl"
    }
  ];

  const yearlyDiscount = 17; // 17% discount for yearly

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="bg-primary backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <Header />
      </header>

      {/* Hero Section */}
      <section className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className='flex flex-col items-center justify-center'>
                <BlurText
                    text="Power Up Your Legal Workflow"
                    className="hidden md:block text-4xl lg:text-6xl font-bold font-serif text-foreground mb-6"
                />
                <h1 className='md:hidden text-4xl lg:text-6xl font-bold font-serif text-foreground mb-6'>Power Up Your Legal Workflow</h1>
                
                <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
                    Choose the plan that fits your needs. Upgrade or downgrade at any time. 
                    All plans include our core AI-powered document analysis features.
                </p>
            </span>
        

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-16">
            <div className="bg-secondary p-1 rounded-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-secondary text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Yearly
                <span className="absolute -top-3 -right-4 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save {yearlyDiscount}%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl p-8 transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? 'bg-secondary shadow-2xl border-2 border-blue-500'
                    : 'bg-secondary shadow-lg border border-tertiary hover:shadow-xl'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 ">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-xs md:text-sm font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center mb-4">
                    {plan.name === 'Basic' && <FileText className="w-8 h-8 text-blue-600" />}
                    {plan.name === 'Standard' && <Zap className="w-8 h-8 text-blue-600" />}
                    {plan.name === 'Premium' && <Crown className="w-8 h-8 text-purple-600" />}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-6">{plan.subtitle}</p>
                  
                  <div className="mb-2">
                    {plan.price[billingCycle] === 'Free' ? (
                      <div className="text-4xl font-bold text-foreground">Free</div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price[billingCycle]}
                        </span>
                        <span className="text-muted-foreground">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {plan.originalPrice && plan.originalPrice[billingCycle] && billingCycle === 'yearly' && (
                    <div className="text-sm text-muted-foreground">
                      <span className="line-through">{plan.originalPrice[billingCycle]}/year</span>
                      <span className="ml-2 text-green-600 font-semibold">
                        Save {yearlyDiscount}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                        feature.included 
                          ? 'bg-green-500/80 text-white' 
                          : 'bg-gray-700/20 text-gray-400'
                      }`}>
                        {feature.included ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <span className="w-2 h-2 bg-current rounded-full opacity-30"></span>
                        )}
                      </div>
                      <span className={`text-sm ${
                        feature.included 
                          ? 'text-foreground' 
                          : 'text-muted-foreground'
                      }`}>
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link href="/frontend/register" className="block">
                  <button
                    className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${plan.ctaStyle} cursor-pointer`}
                  >
                    {plan.ctaText}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

     

      {/* FAQ Section */}
      <section className="py-24 bg-accent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold font-serif text-foreground mb-4">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-8">
            <div className="bg-secondary rounded-2xl p-8 shadow-lg">
              <h4 className="text-lg font-semibold text-foreground mb-3">
                Can I change my plan anytime?
              </h4>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                and you'll be charged prorated amounts for upgrades.
              </p>
            </div>

            <div className="bg-secondary rounded-2xl p-8 shadow-lg">
              <h4 className="text-lg font-semibold text-foreground mb-3">
                Is there a free trial for paid plans?
              </h4>
              <p className="text-muted-foreground">
                Yes, we offer a Basic tier for free. No credit card required to start. 
                You can opt to upgrade to a paid plan anytime.
              </p>
            </div>

            <div className="bg-secondary rounded-2xl p-8 shadow-lg">
              <h4 className="text-lg font-semibold text-foreground mb-3">
                How secure is my data?
              </h4>
              <p className="text-muted-foreground">
                We use bank-grade encryption and comply with all major legal industry security standards. 
                Your documents are encrypted at rest and in transit, and we never share your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold font-serif text-foreground mb-6">
            Ready to Transform Your Legal Practice?
          </h3>
          <p className="text-lg text-muted-foreground mb-10">
            Join thousands of legal professionals who've streamlined their workflow with LegalynX.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/frontend/register">
              <button className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                Start Free Trial
              </button>
            </Link>
          </div>
          
          <p className="text-muted-foreground mt-6 text-sm">
            No credit card required 
          </p>
        </div>
      </section>
    </div>
  );
}

export default EnhancedPricing;