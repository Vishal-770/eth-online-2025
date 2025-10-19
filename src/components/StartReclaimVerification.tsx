"use client";

import { useState } from "react";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StartReclaimVerification() {
  const [proofs, setProofs] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerification = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1) Fetch the configuration from backend
      const response = await fetch("/api/generate-config", {
        cache: "no-store",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data?.error || `Failed to fetch config: ${response.status}`
        );
      }
      const { reclaimProofRequestConfig } = await response.json();

      // 2) Initialize from config
      const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(
        reclaimProofRequestConfig
      );

      // 3) Trigger the verification flow
      await reclaimProofRequest.triggerReclaimFlow();

      // 4) Listen for proof submissions
      await reclaimProofRequest.startSession({
        onSuccess: (proofs: unknown) => {
          setProofs(proofs);
          setIsLoading(false);
        },
        onError: (err: unknown) => {
          console.error("Verification failed", err);
          setError("Verification failed. Please try again.");
          setIsLoading(false);
        },
      });
    } catch (e) {
      if (e instanceof Error) {
        console.error("Error initializing Reclaim:", e);
        setError(e?.message || "Unexpected error. Please check console.");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">
            Reclaim Verification
          </CardTitle>
          <CardDescription className="text-foreground/60">
            Click the button below to start the verification process
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={handleVerification}
            disabled={isLoading}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? "Verifying..." : "Start Verification"}
          </Button>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {proofs !== null && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-foreground">
              ✅ Verification Successful!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs whitespace-pre-wrap break-words p-3 bg-background rounded-md border border-border overflow-auto max-h-96 text-foreground">
              {JSON.stringify(proofs, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
