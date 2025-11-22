'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ResumeErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ResumeErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ResumeErrorBoundary extends React.Component<ResumeErrorBoundaryProps, ResumeErrorBoundaryState> {
  constructor(props: ResumeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ResumeErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Resume Editor Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <p>The resume editor encountered an unexpected error.</p>
                {this.state.error?.message && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Technical details</summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded text-left overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/dashboard'} 
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}