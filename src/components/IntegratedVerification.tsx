"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";
import lighthouse from "@lighthouse-web3/sdk";
import { ethers } from "ethers";
import client from "@/lib/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, Loader2, AlertCircle } from "lucide-react";

interface LighthouseError {
  response?: {
    status?: number;
    statusText?: string;
    data?: unknown;
  };
  message?: string;
  stack?: string;
}

interface ProofData {
  identifier: string;
  claimData: {
    provider: string;
    parameters: string;
    owner: string;
    timestampS: number;
    context: string;
    identifier: string;
    epoch: number;
  };
  signatures: string[];
  witnesses: Array<{
    id: string;
    url: string;
  }>;
  publicData: Record<string, unknown>;
}

interface VerifiedProofResponse {
  success: boolean;
  message: string;
  identifier: string;
  userid: string;
  provider: string;
  timestamp: number;
  providerHash: string;
  fullProof: ProofData;
}

export default function IntegratedVerification() {
  const account = useActiveAccount();
  const address = account?.address;

  // States
  const [currentStep, setCurrentStep] = useState<
    "connect" | "verify" | "upload" | "complete"
  >("connect");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proofData, setProofData] = useState<VerifiedProofResponse | null>(
    null
  );
  const [uploadedCID, setUploadedCID] = useState<string>("");

  // Update step when wallet connects
  useEffect(() => {
    if (address && currentStep === "connect") {
      setCurrentStep("verify");
    }
  }, [address, currentStep]);

  // Step 1: Start Reclaim Verification
  const startReclaimVerification = async () => {
    try {
      setIsVerifying(true);
      setError(null);

      console.log("🔍 Starting Reclaim verification...");

      // Fetch configuration from backend
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
      console.log("✅ Config fetched");

      // Initialize Reclaim Proof Request
      const reclaimProofRequest = await ReclaimProofRequest.fromJsonString(
        reclaimProofRequestConfig
      );

      // Trigger verification flow
      await reclaimProofRequest.triggerReclaimFlow();
      console.log("✅ Reclaim flow triggered");

      // Wait for proof submission
      await reclaimProofRequest.startSession({
        onSuccess: async (proofs: unknown) => {
          console.log("✅ Raw proof received from Reclaim:", proofs);
          console.log("✅ Proof type:", typeof proofs);
          console.log("✅ Is Array:", Array.isArray(proofs));
          console.log(
            "✅ Proof keys:",
            proofs ? Object.keys(proofs as object) : []
          );
          console.log("✅ Stringified proof:", JSON.stringify(proofs, null, 2));

          let proof: ProofData;

          // Handle different proof formats
          if (Array.isArray(proofs) && proofs.length > 0) {
            proof = proofs[0] as ProofData;
            console.log("✅ Using array format, first proof:", proof);
          } else if (
            proofs &&
            typeof proofs === "object" &&
            "identifier" in proofs
          ) {
            proof = proofs as ProofData;
            console.log("✅ Using single proof object:", proof);
          } else if (
            proofs &&
            typeof proofs === "object" &&
            "proofs" in proofs
          ) {
            const proofsObj = proofs as { proofs: ProofData[] };
            if (
              Array.isArray(proofsObj.proofs) &&
              proofsObj.proofs.length > 0
            ) {
              proof = proofsObj.proofs[0];
              console.log("✅ Using proofs property, first proof:", proof);
            } else {
              console.error(
                "❌ Invalid proof format in proofs property:",
                proofs
              );
              setError("Invalid proof format received");
              setIsVerifying(false);
              return;
            }
          } else {
            console.error("❌ Unknown proof format:", proofs);
            setError("Invalid proof format received from Reclaim");
            setIsVerifying(false);
            return;
          }

          console.log("✅ Final proof structure:", proof);

          // Extract data from the proof
          const userid = (proof.publicData?.userid as string) || "unknown";
          const provider = proof.claimData?.provider || "unknown";
          const timestamp = proof.claimData?.timestampS || 0;

          // Parse context to get provider hash
          let providerHash = "";
          try {
            const context = JSON.parse(proof.claimData?.context || "{}");
            providerHash = context?.providerHash || "";
          } catch (e) {
            console.warn("Could not parse context:", e);
          }

          // Create the VerifiedProofResponse structure
          const verifiedProof: VerifiedProofResponse = {
            success: true,
            message: "Proof verified successfully",
            identifier: proof.identifier,
            userid: userid,
            provider: provider,
            timestamp: timestamp,
            providerHash: providerHash,
            fullProof: proof,
          };

          console.log("✅ Verified proof data:", verifiedProof);

          setProofData(verifiedProof);
          setIsVerifying(false);
          setCurrentStep("upload");

          // Auto-upload to Lighthouse
          await uploadToLighthouse(verifiedProof);
        },
        onError: (err: unknown) => {
          console.error("❌ Verification failed:", err);
          setError("Verification failed. Please try again.");
          setIsVerifying(false);
        },
      });
    } catch (err) {
      console.error("❌ Error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
      setIsVerifying(false);
    }
  };

  // Step 2: Get authentication signature using ethers.js Web3Provider (browser method from docs)
  const getAuthenticationToken = async (): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    console.log("🔐 Getting Lighthouse authentication signature...");
    console.log("  - Wallet Address:", address);

    try {
      // Check if window.ethereum is available (MetaMask/browser wallet)
      if (
        typeof window === "undefined" ||
        !(window as Window & { ethereum?: unknown }).ethereum
      ) {
        throw new Error(
          "Browser wallet not detected. Please install MetaMask or connect your wallet."
        );
      }

      // Create ethers provider from window.ethereum (EXACTLY as in Lighthouse docs)
      console.log("  - Creating ethers Web3Provider...");
      const ethereum = (
        window as unknown as Window & { ethereum: ethers.Eip1193Provider }
      ).ethereum;
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      console.log("  - Signer address:", signerAddress);
      console.log("  - Expected address:", address);

      // Verify addresses match
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error(`Address mismatch: ${signerAddress} !== ${address}`);
      }

      // Step 1: Get the authentication message from Lighthouse SDK
      console.log("  - Requesting auth message from Lighthouse...");
      const authResponse = await lighthouse.getAuthMessage(signerAddress);
      const messageRequested = authResponse?.data?.message;

      if (!messageRequested) {
        throw new Error("Failed to get authentication message from Lighthouse");
      }

      console.log("  - Message from Lighthouse:", messageRequested);
      console.log("  - Message length:", messageRequested.length);

      // Step 2: Sign the message using ethers signer
      console.log("  - Signing message with ethers signer...");
      const signedMessage = await signer.signMessage(messageRequested);

      console.log("  - Message signed successfully!");
      console.log("  - Full signature:", signedMessage);
      console.log("  - Signature length:", signedMessage.length);
      console.log(
        "  - Signature format:",
        signedMessage.startsWith("0x") ? "Valid (0x prefix)" : "Invalid"
      );

      // Verify signature format matches expected pattern (0x + 130 hex chars)
      const signatureRegex = /^0x[0-9a-fA-F]{130}$/;
      const isValidFormat = signatureRegex.test(signedMessage);
      console.log("  - Signature regex test:", isValidFormat);
      console.log("✅ Authentication signature ready");

      return signedMessage;
    } catch (err) {
      console.error("❌ Authentication error:", err);
      console.error("  - Error details:", {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw new Error(
        err instanceof Error
          ? err.message
          : "Failed to authenticate with Lighthouse"
      );
    }
  };

  // Step 3: Upload to Lighthouse (Encrypted JSON)
  const uploadToLighthouse = async (proof: VerifiedProofResponse) => {
    try {
      setCurrentStep("upload");
      setError(null);

      console.log("📤 Uploading to Lighthouse...");
      console.log("📤 Proof data received:", {
        hasFullProof: !!proof.fullProof,
        identifier: proof.identifier,
        userid: proof.userid,
        provider: proof.provider,
      });

      // Check if fullProof exists
      if (!proof.fullProof) {
        console.error("❌ No fullProof in proof data:", proof);
        throw new Error("Invalid proof data: fullProof is missing");
      }

      const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY!;
      console.log("🔑 API Key verification:");
      console.log("  - Exists:", !!apiKey);
      console.log("  - Length:", apiKey?.length);
      console.log("  - First 10 chars:", apiKey?.substring(0, 10));

      if (!apiKey) {
        throw new Error(
          "Lighthouse API key not configured. Please set NEXT_PUBLIC_LIGHTHOUSE_API_KEY in .env.local"
        );
      }

      if (!address) {
        throw new Error("Wallet address not found");
      }

      // Prepare complete proof data as JSON object
      const completeProofData = {
        identifier: proof.fullProof.identifier,
        claimData: {
          provider: proof.fullProof.claimData.provider,
          parameters: proof.fullProof.claimData.parameters,
          owner: proof.fullProof.claimData.owner,
          timestampS: proof.fullProof.claimData.timestampS,
          context: proof.fullProof.claimData.context,
          identifier: proof.fullProof.claimData.identifier,
          epoch: proof.fullProof.claimData.epoch,
        },
        signatures: proof.fullProof.signatures,
        witnesses: proof.fullProof.witnesses,
        publicData: proof.fullProof.publicData,
        metadata: {
          uploadedBy: address,
          uploadedAt: new Date().toISOString(),
          provider: proof.provider,
          userid: proof.userid,
        },
      };

      // Convert JSON to string for upload
      const proofText = JSON.stringify(completeProofData, null, 2);

      console.log("📝 Uploading proof data:");
      console.log("  - Identifier:", proof.fullProof.identifier);
      console.log("  - Provider:", proof.provider);
      console.log("  - User ID:", proof.userid);
      console.log("  - Data Size:", proofText.length, "bytes");
      console.log("  - Has Public Data:", !!proof.fullProof.publicData);
      console.log(
        "  - Public Data Keys:",
        Object.keys(proof.fullProof.publicData || {})
      );

      console.log("🚀 Initiating encrypted upload...");

      // Upload encrypted JSON using Lighthouse SDK's textUploadEncrypted method
      // This method is specifically designed for text/JSON content
      try {
        console.log("📡 Preparing text upload...");
        console.log("   - Text size:", proofText.length, "bytes");
        console.log("   - API Key exists:", !!apiKey);
        console.log("   - API Key length:", apiKey.length);
        console.log("   - API Key preview:", apiKey.substring(0, 15) + "...");
        console.log("   - Address:", address);
        console.log("   - Address length:", address.length);

        // Get authentication signature using Lighthouse SDK (browser method)
        console.log("🔐 Getting authentication signature...");
        const signature = await getAuthenticationToken();
        console.log("   - Full signature:", signature);
        console.log(
          "   - Signature valid:",
          signature.startsWith("0x") && signature.length === 132
        );

        // Upload with the signature using textUploadEncrypted
        console.log("📤 Uploading encrypted text to Lighthouse...");
        console.log("  - Upload parameters:");
        console.log("    * text length:", proofText.length);
        console.log("    * apiKey (first 20 chars):", apiKey.substring(0, 20));
        console.log("    * publicKey/address:", address);
        console.log("    * signature (full):", signature);

        console.log("  - Calling lighthouse.textUploadEncrypted()...");

        // Call textUploadEncrypted with proper error handling
        let uploadResponse: unknown;
        try {
          uploadResponse = await lighthouse.textUploadEncrypted(
            proofText,
            apiKey,
            address,
            signature,
            proof.identifier
          );
        } catch (apiError: unknown) {
          console.error("❌ Lighthouse API error:", apiError);
          if (
            apiError &&
            typeof apiError === "object" &&
            "response" in apiError
          ) {
            const axiosError = apiError as {
              response?: {
                data?: unknown;
                status?: number;
                statusText?: string;
              };
            };
            console.error("  - API response data:", axiosError.response?.data);
            console.error("  - API status:", axiosError.response?.status);
            console.error(
              "  - API status text:",
              axiosError.response?.statusText
            );
          }
          throw apiError;
        }

        console.log("✅ Upload response received!");
        console.log("  - Response type:", typeof uploadResponse);
        console.log("  - Response value:", uploadResponse);
        console.log("  - Is string?", typeof uploadResponse === "string");
        console.log(
          "  - Response keys:",
          typeof uploadResponse === "object" && uploadResponse !== null
            ? Object.keys(uploadResponse)
            : "N/A"
        );

        // Check if authentication failed (response is a string)
        if (typeof uploadResponse === "string") {
          console.error(
            "❌ Upload returned string instead of object:",
            uploadResponse
          );
          throw new Error(`Lighthouse upload failed: ${uploadResponse}`);
        }

        console.log(
          "  - Full response:",
          JSON.stringify(uploadResponse, null, 2)
        );

        // Define the expected response type
        interface LighthouseUploadResponse {
          data?: Array<{
            Hash: string;
            Name: string;
            Size: string;
          }>;
        }

        // Type guard to check if response has the expected structure
        const isValidResponse = (
          response: unknown
        ): response is LighthouseUploadResponse => {
          return (
            typeof response === "object" &&
            response !== null &&
            "data" in response
          );
        };

        // uploadEncrypted returns an array of uploaded files
        if (!isValidResponse(uploadResponse) || !uploadResponse.data) {
          throw new Error("Invalid upload response: no data returned");
        }

        const uploadData = Array.isArray(uploadResponse.data)
          ? uploadResponse.data[0]
          : uploadResponse.data;

        if (!uploadData?.Hash) {
          throw new Error("Invalid upload response: no Hash in data");
        }

        const cid = uploadData.Hash;
        console.log("  - IPFS CID:", cid);
        console.log(
          "  - IPFS URL:",
          `https://gateway.lighthouse.storage/ipfs/${cid}`
        );

        setUploadedCID(cid);
        setCurrentStep("complete");
      } catch (uploadError: unknown) {
        const error = uploadError as LighthouseError;
        console.error("❌ Detailed upload error:", {
          message: error.message ?? String(uploadError),
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
          stack: error.stack?.substring(0, 500),
        });

        // Provide specific error messages based on status code
        if (error.response?.status === 401) {
          throw new Error(
            "Authentication failed: Invalid signature or API key. Please reconnect your wallet and try again."
          );
        } else if (error.response?.status === 403) {
          throw new Error("Access forbidden: Check your API key permissions");
        } else if (error.response?.status === 500) {
          throw new Error(
            "Lighthouse server error: Please try again in a moment"
          );
        }

        throw uploadError;
      }
    } catch (err: unknown) {
      console.error("❌ Upload failed:", err);

      // Detailed error handling
      if (err instanceof Error) {
        if (err.message.includes("401")) {
          setError("Authentication failed. Please try again.");
        } else if (err.message.includes("403")) {
          setError("Access denied. Please check your API key configuration.");
        } else if (err.message.includes("Invalid signature")) {
          setError(
            "Invalid signature. Please reconnect your wallet and try again."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to upload to Lighthouse");
      }

      setCurrentStep("verify");
    }
  };

  // Helper: Copy CID to clipboard
  const copyCID = async () => {
    try {
      await navigator.clipboard.writeText(uploadedCID);
      alert("✅ CID copied to clipboard!");
    } catch {
      alert("❌ Failed to copy CID");
    }
  };

  // Helper: Copy full JSON
  const copyFullJSON = async () => {
    if (!proofData) return;

    const completeProofData = {
      identifier: proofData.fullProof.identifier,
      claimData: proofData.fullProof.claimData,
      signatures: proofData.fullProof.signatures,
      witnesses: proofData.fullProof.witnesses,
      publicData: proofData.fullProof.publicData,
      metadata: {
        uploadedBy: address,
        provider: proofData.provider,
        userid: proofData.userid,
      },
    };

    try {
      const jsonText = JSON.stringify(completeProofData, null, 2);
      await navigator.clipboard.writeText(jsonText);
      alert("✅ Full JSON copied to clipboard!");

      console.log("📋 Complete Proof Data JSON:");
      console.log(jsonText);
    } catch {
      alert("❌ Failed to copy JSON");
    }
  };

  // Helper: Download JSON file
  const downloadJSON = () => {
    if (!proofData) return;

    const completeProofData = {
      identifier: proofData.fullProof.identifier,
      claimData: proofData.fullProof.claimData,
      signatures: proofData.fullProof.signatures,
      witnesses: proofData.fullProof.witnesses,
      publicData: proofData.fullProof.publicData,
      metadata: {
        uploadedBy: address,
        uploadedAt: new Date().toISOString(),
        provider: proofData.provider,
        userid: proofData.userid,
      },
    };

    const jsonText = JSON.stringify(completeProofData, null, 2);
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proof-${proofData.identifier.substring(0, 16)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Helper: View on IPFS
  const viewOnIPFS = () => {
    window.open(
      `https://gateway.lighthouse.storage/ipfs/${uploadedCID}`,
      "_blank"
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">
          Secure Credential Verification
        </CardTitle>
        <CardDescription>
          Connect wallet → Verify credentials → Upload encrypted proof
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Error
              </p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {[
            { id: "connect", label: "Connect" },
            { id: "verify", label: "Verify" },
            { id: "upload", label: "Upload" },
            { id: "complete", label: "Complete" },
          ].map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep === step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : index <
                      ["connect", "verify", "upload", "complete"].indexOf(
                        currentStep
                      )
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {index <
                ["connect", "verify", "upload", "complete"].indexOf(
                  currentStep
                ) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span className="ml-2 text-sm font-medium">{step.label}</span>
              {index < 3 && (
                <div className="w-12 h-0.5 bg-border mx-2 hidden sm:block" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Connect Wallet */}
        {currentStep === "connect" && (
          <div className="text-center py-8 space-y-4">
            <div className="text-6xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold">Connect Your Wallet</h3>
            <p className="text-muted-foreground">
              Connect your wallet to begin the verification process
            </p>
            <div className="pt-4">
              <ConnectButton client={client} />
            </div>
          </div>
        )}

        {/* Step 2: Reclaim Verification */}
        {currentStep === "verify" && (
          <div className="text-center py-8 space-y-4">
            {!isVerifying ? (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-semibold">
                  Verify Your Credentials
                </h3>
                <p className="text-muted-foreground">
                  Prove your identity using Reclaim Protocol
                </p>
                <div className="p-4 bg-background rounded border border-border text-left">
                  <p className="text-sm text-foreground/70 mb-2">
                    Connected Wallet:
                  </p>
                  <p className="font-mono text-sm text-foreground break-all">
                    {address}
                  </p>
                </div>
                <Button
                  onClick={startReclaimVerification}
                  size="lg"
                  className="mt-4"
                >
                  Start Verification
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
                <h3 className="text-xl font-semibold">Verifying...</h3>
                <p className="text-muted-foreground">
                  Please complete the verification in the popup window
                </p>
              </>
            )}
          </div>
        )}

        {/* Step 3: Upload to Lighthouse */}
        {currentStep === "upload" && (
          <div className="text-center py-8 space-y-4">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
            <h3 className="text-xl font-semibold">Uploading to Lighthouse</h3>
            <p className="text-muted-foreground">
              Encrypting and uploading your proof JSON to IPFS...
            </p>
            {proofData && (
              <div className="p-4 bg-background rounded border border-border text-left mt-4">
                <p className="text-sm text-foreground/70 mb-2">
                  Proof Identifier:
                </p>
                <p className="font-mono text-xs text-foreground break-all">
                  {proofData.identifier}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === "complete" && (
          <div className="text-center py-8 space-y-4">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold">Upload Complete!</h3>
            <p className="text-muted-foreground">
              Your proof JSON has been encrypted and uploaded to IPFS
            </p>

            {/* Proof Details */}
            {proofData && (
              <div className="p-4 bg-background rounded border border-border text-left space-y-3">
                <div>
                  <p className="text-xs text-foreground/70">Provider:</p>
                  <p className="text-sm font-medium">{proofData.provider}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/70">User ID:</p>
                  <p className="text-sm font-medium">{proofData.userid}</p>
                </div>
                <div>
                  <p className="text-xs text-foreground/70">Identifier:</p>
                  <p className="font-mono text-xs break-all">
                    {proofData.identifier}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-foreground/70">Timestamp:</p>
                  <p className="text-sm font-medium">
                    {new Date(proofData.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
                {proofData.fullProof?.publicData && (
                  <div>
                    <p className="text-xs text-foreground/70 mb-2">
                      Public Data Fields:
                    </p>
                    <div className="bg-muted p-2 rounded text-xs space-y-1">
                      {Object.keys(proofData.fullProof.publicData).map(
                        (key) => (
                          <div key={key} className="flex items-start gap-2">
                            <span className="text-foreground/70">•</span>
                            <span className="font-medium">{key}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CID Display */}
            <div className="p-6 bg-green-500/10 border-2 border-green-500/20 rounded-lg">
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-3">
                ✅ IPFS Hash (CID)
              </p>
              <p className="font-mono text-sm text-foreground break-all bg-background p-3 rounded border border-border">
                {uploadedCID}
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <Button onClick={copyCID} variant="outline" size="sm">
                  📋 Copy CID
                </Button>
                <Button onClick={viewOnIPFS} variant="outline" size="sm">
                  🔗 View on IPFS
                </Button>
                <Button onClick={copyFullJSON} variant="outline" size="sm">
                  📄 Copy JSON
                </Button>
                <Button onClick={downloadJSON} variant="outline" size="sm">
                  💾 Download JSON
                </Button>
              </div>
            </div>

            {/* Start Over */}
            <Button
              onClick={() => {
                setCurrentStep("verify");
                setProofData(null);
                setUploadedCID("");
                setError(null);
              }}
              variant="outline"
              className="mt-4"
            >
              Verify Another Credential
            </Button>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            ℹ️ Your proof JSON is encrypted end-to-end. Only you (the wallet
            owner) can decrypt it using your private key.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
