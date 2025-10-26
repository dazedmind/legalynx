"use client";

import React, { useState } from "react";
import Header from "../components/layout/Header";
import {
  Check,
  Star,
  Zap,
  Shield,
  Users,
  MessageSquare,
  FileText,
  Clock,
  Headphones,
  Crown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import BlurText from "../components/reactbits/BlurText";
import Link from "next/link";
import { paypalService } from "../../../lib/api";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { authUtils } from "@/lib/auth";

function EnhancedPricing() {
  const { theme } = useTheme();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [showDevelopersModal, setShowDevelopersModal] = useState(false);

  const plans = [
    {
      name: "Basic",
      subtitle: "Perfect for getting started",
      price: {
        monthly: "Free",
        yearly: "Free",
      },
      originalPrice: null,
      popular: false,
      features: [
        { text: "Upload up to 5 documents", included: true },
        { text: "200 messages per session", included: true },
        { text: "Temporary Chat Session", included: true },
        { text: "File Storage", included: false },
        { text: "No token cooldown", included: false },
        { text: "Voice mode", included: false },
      ],
      ctaText: "Get Started Free",
      ctaStyle: `${
        theme === "dark" ? "bg-neutral-600" : "bg-neutral-200 text-foreground"
      }`,
    },
    {
      name: "Standard",
      subtitle: "For growing legal practices",
      price: {
        monthly: "₱129",
        yearly: "₱1,290",
      },
      originalPrice: {
        monthly: null,
        yearly: "₱1,548",
      },
      popular: true,
      features: [
        { text: "Upload up to 20 documents", included: true },
        { text: "500 messages per session", included: true },
        { text: "Save chat sessions", included: true },
        { text: "1GB file storage", included: true },
        { text: "No token cooldown", included: false },
        { text: "Voice mode", included: false },
      ],
      ctaText: "Start Standard",
      ctaStyle:
        "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl",
    },
    {
      name: "Premium",
      subtitle: "For professionals",
      price: {
        monthly: "₱249",
        yearly: "₱2,490",
      },
      originalPrice: {
        monthly: null,
        yearly: "₱2,988",
      },
      popular: false,
      features: [
        { text: "Upload unlimited documents", included: true },
        { text: "Unlimited messages", included: true },
        { text: "Save chat sessions", included: true },
        { text: "10GB file storage", included: true },
        { text: "No token cooldown", included: true },
        { text: "Voice mode", included: true },
      ],
      ctaText: "Go Premium",
      ctaStyle:
        "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl",
    },
  ];

  const yearlyDiscount = 17; // 17% discount for yearly

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header
        className="bg-primary/10 backdrop-blur-md shadow-md fixed top-0 left-0 right-0 w-full z-60"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      >
        <Header />
      </header>

      {/* TOP BLUE GRADIENT */}
      <div className="bg-gradient-to-b from-blue/30 to-transparent w-full h-1/3 rounded-3xl rounded-tr-none rounded-tl-none absolute top-0 left-0"></div>

      {/* Hero Section */}
      <section className="pt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="flex flex-col items-center justify-center">
            <BlurText
              text="Power Up Your Legal Workflow"
              className="hidden md:block text-4xl lg:text-6xl font-bold font-serif text-foreground mb-6"
            />
            <h1 className="md:hidden text-4xl lg:text-6xl font-bold font-serif text-foreground mb-6">
              Power Up Your Legal Workflow
            </h1>

            <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
              Choose the plan that fits your needs. Upgrade or downgrade at any
              time. All plans include our core AI-powered document analysis
              features.
            </p>
          </span>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-16">
            <div className="bg-secondary p-1 rounded-lg">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 relative cursor-pointer ${
                  billingCycle === "yearly"
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <span className="absolute -top-3 -right-4 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
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
                className={`relative rounded-3xl p-8 transition-all duration-300  ${
                  plan.popular
                    ? "bg-secondary shadow-2xl border-2 border-blue-500"
                    : "bg-secondary shadow-lg border border-tertiary"
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
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground mb-6">{plan.subtitle}</p>

                  <div className="mb-2">
                    {plan.price[billingCycle] === "Free" ? (
                      <div className="text-4xl font-bold text-foreground">
                        Free
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-4xl font-bold text-foreground">
                          {plan.price[billingCycle]}
                        </span>
                        <span className="text-muted-foreground">
                          /{billingCycle === "monthly" ? "month" : "year"}
                        </span>
                      </div>
                    )}
                  </div>

                  {plan.originalPrice &&
                    plan.originalPrice[billingCycle] &&
                    billingCycle === "yearly" && (
                      <div className="text-sm text-muted-foreground">
                        <span className="line-through">
                          {plan.originalPrice[billingCycle]}/year
                        </span>
                        <span className="ml-2 text-blue-600 font-semibold">
                          Save {yearlyDiscount}%
                        </span>
                      </div>
                    )}
                </div>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                          feature.included
                            ? "bg-green-500/80 text-white"
                            : "bg-gray-700/20 text-gray-400"
                        }`}
                      >
                        {feature.included ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <span className="w-2 h-2 bg-current rounded-full opacity-30"></span>
                        )}
                      </div>
                      <span
                        className={`text-sm ${
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={async () => {
                    try {
                      const token = authUtils.getToken();
                      if (!token) {
                        // Redirect to register with return URL to come back to pricing after registration
                        window.location.href =
                          "/frontend/register?returnUrl=" +
                          encodeURIComponent("/frontend/pricing");
                        return;
                      }
                      const planCode = plan.name.toUpperCase() as
                        | "BASIC"
                        | "STANDARD"
                        | "PREMIUM";
                      const billing: "monthly" | "yearly" = billingCycle;
                      const { approvalUrl } =
                        await paypalService.createSubscription(
                          planCode,
                          billing
                        );
                      if (approvalUrl) {
                        window.location.href = approvalUrl; // Redirect to PayPal sandbox approval
                      } else {
                        toast.error("Could not get PayPal approval URL");
                      }
                    } catch (e: any) {
                      toast.error(
                        e?.response?.data?.error ||
                          "Failed to create subscription"
                      );
                    }
                  }}
                  className={`flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform ${plan.ctaStyle} cursor-pointer group`}
                >
                  {plan.ctaText}
                  <ArrowRight className="w-4 h-4 group-hover:visible group-hover:translate-x-1 transition-all duration-300 invisible" />
                </button>
              </div>
            ))}
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
            Join thousands of legal professionals who've streamlined their
            workflow with LegalynX.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/frontend/register">
              <button className="px-10 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer">
                Start Free Trial
              </button>
            </Link>
          </div>

          <p className="text-muted-foreground mt-6 text-sm">
            No credit card required
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
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="flex items-center gap-2">
                <h3 className="text-2xl font-bold text-foreground">
                  The Developers
                </h3>
              </span>

              <button
                onClick={() => setShowDevelopersModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Developer 1 */}
              <div className="border border-tertiary rounded-md p-4 hover:border-blue/50 transition-colors">
                <h4 className="text-xl font-semibold text-foreground">
                  Kristhia Cayle F. Lastra
                </h4>
                <p className="text-sm text-blue-600 mb-2">
                  Backend Engineer & Documentation Lead
                </p>
                <p className="text-muted-foreground text-sm">
                  Specializes in the backend architecture, and system
                  optimization. Led the development of the RAG pipeline and
                  system documentation.
                </p>
              </div>

              {/* Developer 2 */}
              <div className="border border-tertiary rounded-md p-4 hover:border-blue/50 transition-colors">
                <h4 className="text-xl font-semibold text-foreground">
                  John Allen Troy E. Valeña
                </h4>
                <p className="text-sm text-blue-600 mb-2">
                  Full-stack Developer & UI/UX Engineer
                </p>
                <p className="text-muted-foreground text-sm">
                  Focuses on integration of backend to frontend, user
                  experience, interface design. Created the modern UI components
                  and interactive features.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedPricing;
