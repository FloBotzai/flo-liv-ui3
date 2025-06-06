'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { ArrowRight, MessageSquare, Image, FileText, Code, Sparkles } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: MessageSquare,
      title: "Intelligent Conversations",
      description: "Engage in natural, context-aware conversations to solve problems efficiently."
    },
    {
      icon: Code,
      title: "Code Generation",
      description: "Generate and refine code snippets across multiple programming languages."
    },
    {
      icon: FileText,
      title: "Document Creation",
      description: "Create and edit documents with AI-powered assistance and formatting."
    },
    {
      icon: Image,
      title: "Image Generation",
      description: "Transform ideas into visual content with powerful image generation."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          FloBotz <span className="text-primary">AI</span> Assistant
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-8">
          Your intelligent companion for code, content, and creativity
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/login">
              Login
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">
              Sign Up
            </Link>
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4 md:px-6 lg:px-8 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <feature.icon className="size-6 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 px-4 bg-primary/5 text-center">
        <div className="container mx-auto max-w-3xl">
          <Sparkles className="size-8 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Sign up now and experience the power of AI-assisted productivity.
          </p>
          <Button asChild size="lg">
            <Link href="/register" className="flex items-center">
              Create Free Account
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-muted-foreground">
              © 2025 FloBotz AI. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
