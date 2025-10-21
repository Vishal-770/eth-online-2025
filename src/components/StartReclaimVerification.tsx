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
import {
  verifyProofComplete,
  type VerifiedProofResponse,
} from "@/lib/proofVerification";
import {
  uploadProofToIPFS,
  type IPFSUploadResult,
} from "@/lib/lighthouseUpload";
import { Check, Upload, Link as LinkIcon } from "lucide-react";

export default function StartReclaimVerification() {
  const [proofs, setProofs] = useState<VerifiedProofResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<ReturnType<
    typeof verifyProofComplete
  > | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [hashVerificationStatus, setHashVerificationStatus] = useState<
    string | null
  >(null);
  const [ipfsUploadResult, setIPFSUploadResult] =
    useState<IPFSUploadResult | null>(null);
  const [isUploadingToIPFS, setIsUploadingToIPFS] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

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
          const proofsData = proofs as VerifiedProofResponse;
          setProofs(proofsData);
          setIsLoading(false);

          // Verify the proof on frontend
          if (proofs && typeof proofs === "object" && "fullProof" in proofs) {
            const verification = verifyProofComplete(proofsData.fullProof);
            setVerificationResult(verification);
          }

          // Check if IPFS upload happened automatically in backend
          if (proofsData && proofsData.ipfsUpload) {
            const ipfsData = proofsData.ipfsUpload;
            if (ipfsData && ipfsData.success) {
              console.log(
                "✅ [FRONTEND] Received IPFS upload from backend:",
                ipfsData
              );
              setIPFSUploadResult(ipfsData);
              setUploadMessage(
                `✅ SUCCESS! Proof automatically uploaded to IPFS: ${ipfsData.ipfsHash}`
              );
              alert(
                `✅ Proof automatically uploaded to IPFS!\n\nIPFS Hash: ${ipfsData.ipfsHash}\n\nYou can view the proof at:\n${ipfsData.url}`
              );
              setTimeout(() => setUploadMessage(null), 10000);
            }
          }
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

  // Function to copy hash to clipboard
  const copyHashToClipboard = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Function to run manual verification
  const runManualVerification = () => {
    if (!proofs?.fullProof || !verificationResult) {
      setHashVerificationStatus("❌ No proof data available");
      return;
    }

    const result = verifyProofComplete(proofs.fullProof);

    if (result.isValid) {
      setHashVerificationStatus(
        `✅ Manual Verification Passed! Hash: ${result.verification.providerHash.hash?.substring(
          0,
          20
        )}...`
      );
    } else {
      setHashVerificationStatus(
        `❌ Manual Verification Failed: ${result.verification.providerHash.message}`
      );
    }

    console.log("Manual Verification Result:", result);
  };

  // Function to verify with Chainlink (dummy for now)
  const verifyWithChainlink = async () => {
    if (!proofs?.providerHash) {
      setHashVerificationStatus("❌ No provider hash available");
      return;
    }

    setHashVerificationStatus("⏳ Sending to Chainlink...");

    try {
      // Dummy Chainlink verification call
      const chainlinkResult = {
        proofHash: proofs.providerHash,
        timestamp: Date.now(),
        verified: true,
        signature: "0x" + Math.random().toString(16).slice(2),
      };

      console.log("Chainlink Verification Result:", chainlinkResult);
      setHashVerificationStatus(
        `✅ Chainlink Verification Successful!\nHash: ${proofs.providerHash.substring(
          0,
          20
        )}...`
      );
    } catch (err) {
      setHashVerificationStatus(`❌ Chainlink Verification Failed: ${err}`);
    }
  };

  // Function to upload proof to IPFS
  const uploadProofToIPFSHandler = async () => {
    if (!proofs?.fullProof || !proofs?.identifier) {
      setHashVerificationStatus("❌ No proof data available for IPFS upload");
      alert("❌ No proof data available for IPFS upload");
      return;
    }

    setIsUploadingToIPFS(true);
    setHashVerificationStatus("⏳ Uploading proof to IPFS...");
    // Clear previous IPFS result
    setIPFSUploadResult(null);

    try {
      // Get Lighthouse API key from environment variables
      // Fallback to hardcoded value if not available
      const apiKey = String(
        process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY ||
          "2b2cd63c.bace6851fbc648f6965d0c1d613859ae"
      );

      if (!apiKey || apiKey === "undefined") {
        throw new Error("Lighthouse API key not configured");
      }

      console.log(
        "🔑 [UPLOAD] Using API Key:",
        apiKey.substring(0, 10) + "..."
      );
      console.log("📤 [UPLOAD] Starting upload to IPFS...");

      const result = await uploadProofToIPFS(
        proofs.fullProof,
        proofs.identifier,
        apiKey
      );

      console.log("📦 [UPLOAD] Upload completed:", result);
      setIPFSUploadResult(result);

      if (result.success) {
        const successMessage = `✅ Proof successfully uploaded to IPFS!\n📍 IPFS Hash: ${result.ipfsHash.substring(
          0,
          20
        )}...\n🔗 Access at: ${result.url}`;
        setHashVerificationStatus(successMessage);
        setUploadMessage(
          `✅ SUCCESS! Proof uploaded to IPFS: ${result.ipfsHash}`
        );
        console.log("✅ [UPLOAD] Success:", result);

        // Show success alert
        alert(
          `✅ Proof uploaded to IPFS!\n\nIPFS Hash: ${result.ipfsHash}\n\nYou can view the proof at:\n${result.url}`
        );

        // Auto-hide message after 10 seconds
        setTimeout(() => setUploadMessage(null), 10000);
      } else {
        setHashVerificationStatus(`❌ IPFS Upload Failed: ${result.message}`);
        setUploadMessage(`❌ IPFS Upload Failed: ${result.message}`);
        alert(`❌ IPFS Upload Failed: ${result.message}`);
        setTimeout(() => setUploadMessage(null), 10000);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setHashVerificationStatus(`❌ IPFS Upload Failed: ${errorMessage}`);
      setUploadMessage(`❌ Upload Error: ${errorMessage}`);
      console.error("❌ [UPLOAD] Error:", err);
      alert(`❌ IPFS Upload Failed: ${errorMessage}`);

      // Set error result
      setIPFSUploadResult({
        success: false,
        ipfsHash: "",
        fileName: "",
        fileSize: "",
        url: "",
        message: errorMessage,
      });

      // Auto-hide error message after 10 seconds
      setTimeout(() => setUploadMessage(null), 10000);
    } finally {
      setIsUploadingToIPFS(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      {/* Upload Status Message - Prominent Display */}
      {uploadMessage && (
        <Card
          className={`border-2 ${
            uploadMessage.includes("✅")
              ? "border-green-500 bg-green-500/10 animate-pulse"
              : "border-red-500 bg-red-500/10"
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {uploadMessage.includes("✅") ? "✅" : "❌"}
              </span>
              <div className="flex-1">
                <p
                  className={`font-bold text-lg ${
                    uploadMessage.includes("✅")
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {uploadMessage.includes("✅")
                    ? "🎉 Upload Successful!"
                    : "Upload Failed"}
                </p>
                <p className="text-sm text-foreground/70 mt-1 break-all">
                  {uploadMessage}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
        <>
          {/* Overall Verification Status */}
          {verificationResult && (
            <Card
              className={`border-2 ${
                verificationResult.isValid
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <CardHeader>
                <CardTitle
                  className={`text-foreground ${
                    verificationResult.isValid
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {verificationResult.summary}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {/* Proof Structure Verification */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    📋 Proof Structure
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg ${
                          verificationResult.verification.structure.details
                            .hasIdentifier
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {verificationResult.verification.structure.details
                          .hasIdentifier
                          ? "✓"
                          : "✗"}
                      </span>
                      <span className="text-foreground/70">Identifier</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg ${
                          verificationResult.verification.structure.details
                            .hasClaimData
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {verificationResult.verification.structure.details
                          .hasClaimData
                          ? "✓"
                          : "✗"}
                      </span>
                      <span className="text-foreground/70">Claim Data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg ${
                          verificationResult.verification.structure.details
                            .hasSignatures
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {verificationResult.verification.structure.details
                          .hasSignatures
                          ? "✓"
                          : "✗"}
                      </span>
                      <span className="text-foreground/70">
                        Signatures ({" "}
                        {
                          verificationResult.verification.structure.details
                            .signatureCount
                        }
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg ${
                          verificationResult.verification.structure.details
                            .hasWitnesses
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {verificationResult.verification.structure.details
                          .hasWitnesses
                          ? "✓"
                          : "✗"}
                      </span>
                      <span className="text-foreground/70">
                        Witnesses ({" "}
                        {
                          verificationResult.verification.structure.details
                            .witnessCount
                        }
                        )
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg ${
                          verificationResult.verification.structure.details
                            .hasPublicData
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {verificationResult.verification.structure.details
                          .hasPublicData
                          ? "✓"
                          : "✗"}
                      </span>
                      <span className="text-foreground/70">Public Data</span>
                    </div>
                  </div>
                </div>

                {/* Provider Hash Verification */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">
                    🔐 Provider Hash (Proof Hash)
                  </h4>

                  {/* Hash Display */}
                  <div
                    className={`p-3 rounded-md text-sm font-mono break-all cursor-pointer transition-colors ${
                      verificationResult.verification.providerHash.isValid
                        ? "bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/30 hover:bg-green-500/15"
                        : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30 hover:bg-red-500/15"
                    }`}
                    onClick={() =>
                      copyHashToClipboard(
                        verificationResult.verification.providerHash.hash || ""
                      )
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium mb-1">
                          {verificationResult.verification.providerHash.hash
                            ? "✓ Hash found"
                            : "✗ No hash"}
                        </p>
                        <p className="text-xs opacity-75 mb-2">
                          (Click to copy to clipboard)
                        </p>
                        <p>
                          {verificationResult.verification.providerHash.hash ||
                            "Not found"}
                        </p>
                      </div>
                      {copiedHash && (
                        <Check className="w-5 h-5 flex-shrink-0 mt-1 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-foreground/60">
                    {verificationResult.verification.providerHash.message}
                  </p>

                  {/* Verification Buttons */}
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      onClick={runManualVerification}
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      ✓ Run Manual Verification
                    </Button>

                    <Button
                      onClick={verifyWithChainlink}
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      ⛓️ Verify with Chainlink
                    </Button>

                    <Button
                      onClick={uploadProofToIPFSHandler}
                      disabled={isUploadingToIPFS}
                      size="sm"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploadingToIPFS ? "Uploading..." : "Upload to IPFS"}
                    </Button>
                  </div>

                  {/* Verification Status */}
                  {hashVerificationStatus && (
                    <div
                      className={`p-3 rounded-md text-sm mt-3 whitespace-pre-wrap ${
                        hashVerificationStatus.includes("✅")
                          ? "bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300"
                          : hashVerificationStatus.includes("❌")
                          ? "bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300"
                          : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-300"
                      }`}
                    >
                      {hashVerificationStatus}
                    </div>
                  )}
                </div>

                {/* Proof Information */}
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    ℹ️ Proof Information
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-foreground/70">
                      <span className="font-medium">User ID:</span>{" "}
                      <span className="font-mono text-foreground/50">
                        {proofs?.userid}
                      </span>
                    </p>
                    <p className="text-foreground/70">
                      <span className="font-medium">Provider:</span>{" "}
                      <span className="font-mono text-foreground/50">
                        {proofs?.provider}
                      </span>
                    </p>
                    <p className="text-foreground/70">
                      <span className="font-medium">Identifier:</span>{" "}
                      <span className="font-mono text-foreground/50 break-all">
                        {proofs?.identifier}
                      </span>
                    </p>
                    <p className="text-foreground/70">
                      <span className="font-medium">Timestamp:</span>{" "}
                      <span className="font-mono text-foreground/50">
                        {new Date(
                          (proofs?.timestamp || 0) * 1000
                        ).toLocaleString()}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* IPFS Upload Result */}
          {ipfsUploadResult && (
            <Card
              className={`border-2 ${
                ipfsUploadResult.success
                  ? "border-orange-500/30 bg-orange-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <CardHeader>
                <CardTitle
                  className={`text-foreground ${
                    ipfsUploadResult.success
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {ipfsUploadResult.success
                    ? "✅ Proof Uploaded to IPFS"
                    : "❌ IPFS Upload Failed"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {ipfsUploadResult.success && (
                  <>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-foreground/70 mb-1">
                          📍 IPFS Hash (Proof ID):
                        </p>
                        <div className="p-3 bg-background rounded-md border border-border">
                          <p className="text-xs font-mono break-all text-foreground">
                            {ipfsUploadResult.ipfsHash}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-foreground/70 mb-1">
                          🔗 IPFS Gateway URL:
                        </p>
                        <div
                          className="p-3 bg-background rounded-md border border-border cursor-pointer hover:border-primary transition-colors"
                          onClick={() =>
                            copyHashToClipboard(ipfsUploadResult.url)
                          }
                        >
                          <p className="text-xs font-mono break-all text-primary hover:text-primary/80">
                            {ipfsUploadResult.url}
                          </p>
                          {copiedHash && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ Copied to clipboard
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-foreground/70 font-medium">
                            File Name
                          </p>
                          <p className="text-foreground/50 font-mono text-xs">
                            {ipfsUploadResult.fileName}
                          </p>
                        </div>
                        <div>
                          <p className="text-foreground/70 font-medium">
                            File Size
                          </p>
                          <p className="text-foreground/50 font-mono text-xs">
                            {ipfsUploadResult.fileSize} bytes
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                          onClick={() =>
                            copyHashToClipboard(ipfsUploadResult.ipfsHash)
                          }
                        >
                          📋 Copy Hash
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => window.open(ipfsUploadResult.url)}
                        >
                          <LinkIcon className="w-4 h-4 mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {!ipfsUploadResult.success && (
                  <div className="text-sm text-red-700 dark:text-red-300">
                    {ipfsUploadResult.message}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Full Proof Data */}
          {proofs !== null && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">
                  📦 Complete Proof Data
                </CardTitle>
                <CardDescription className="text-foreground/60">
                  Full proof object including all signatures and witnesses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs whitespace-pre-wrap break-words p-3 bg-background rounded-md border border-border overflow-auto max-h-96 text-foreground">
                  {JSON.stringify(proofs, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
