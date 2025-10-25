"use client";

import React, { useState } from "react";
import Header from "../components/layout/Header";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import BlurText from "../components/reactbits/BlurText";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Form submitted:", formData);
    alert("Thank you for your message! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="bg-primary/10 backdrop-blur-md shadow-md fixed top-0 left-0 right-0 w-full z-50">
        <Header />
      </header>


      {/* Main Content */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative">
      <div className="bg-gradient-to-b from-blue/30 to-transparent w-full h-1/3 rounded-3xl rounded-tr-none rounded-tl-none absolute top-0 left-0">
      </div>
        <div className="max-w-6xl mx-auto">
          {/* Page Title */}
          <span className='flex flex-col items-center justify-center'>
                <BlurText
                    text="Get In Touch"
                    className="text-4xl lg:text-6xl font-bold font-serif text-foreground mb-6"
                />
                
                <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.

                </p>
            </span>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <div className="bg-tertiary rounded-2xl p-6 border border-tertiary hover:shadow-lg cursor-default transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue/10 rounded-lg">
                    <Mail className="w-6 h-6 text-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Email</h3>
                    <p className="text-sm text-muted-foreground">support@legalynx.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-tertiary rounded-2xl p-6 border border-tertiary hover:shadow-lg cursor-default transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue/10 rounded-lg">
                    <Phone className="w-6 h-6 text-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>

              <div className="bg-tertiary rounded-2xl p-6 border border-tertiary hover:shadow-lg cursor-default transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue/10 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Office</h3>
                    <p className="text-sm text-muted-foreground">Manila, Philippines</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-tertiary rounded-2xl p-8 border border-tertiary">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg bg-primary border border-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-all"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg bg-primary border border-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-all"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-primary border border-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-all"
                      placeholder="How can we help?"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg bg-primary border border-tertiary text-foreground focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent transition-all resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue hover:brightness-110 text-white font-semibold px-6 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
