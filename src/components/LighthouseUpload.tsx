"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { ConnectButton } from "thirdweb/react";
import lighthouse from "@lighthouse-web3/sdk";
import client from "@/lib/client";
import { signMessage } from "thirdweb/utils";

export default function LighthouseUpload() {
  const account = useActiveAccount();
  const address = account?.address;

  const [jwt, setJwt] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCID, setUploadedCID] = useState<string>("");
  const [textToEncrypt, setTextToEncrypt] = useState("");
  const [error, setError] = useState<string>("");

  // Check for stored JWT on mount
  useEffect(() => {
    if (address) {
      const storedJwt = localStorage.getItem(`lighthouse-jwt-${address}`);
      if (storedJwt) {
        setJwt(storedJwt);
      }
    }
  }, [address]);

  // Authenticate with Lighthouse
  const authenticateWithLighthouse = async () => {
    if (!account || !address) {
      setError("Please connect your wallet first!");
      return;
    }

    try {
      setIsAuthenticating(true);
      setError("");

      // Step 1: Get authentication message from Lighthouse
      const response = await fetch(
        `https://api.lighthouse.storage/api/auth/get_message?publicKey=${address}`
      );
      const { message } = await response.json();

      // Step 2: Sign the message with Thirdweb v5 signMessage utility
      const signedMessage = await signMessage({
        message,
        account,
      });

      // Step 3: Get JWT from Lighthouse
      const jwtResponse = await fetch(
        "https://api.lighthouse.storage/api/auth/verify_signer",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicKey: address,
            signedMessage: signedMessage,
          }),
        }
      );
      const { JWT } = await jwtResponse.json();

      setJwt(JWT);
      localStorage.setItem(`lighthouse-jwt-${address}`, JWT);

      console.log("✅ Authenticated successfully");
    } catch (err) {
      console.error("Authentication error:", err);
      setError("Failed to authenticate with Lighthouse");
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Upload encrypted text
  const uploadEncryptedText = async () => {
    if (!jwt || !address) {
      setError("Please authenticate first!");
      return;
    }

    if (!textToEncrypt.trim()) {
      setError("Please enter text to encrypt");
      return;
    }

    try {
      setIsUploading(true);
      setError("");

      const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;

      if (!apiKey) {
        throw new Error("Lighthouse API key not found");
      }

      // Upload encrypted text
      const uploadResponse = await lighthouse.textUploadEncrypted(
        textToEncrypt,
        apiKey,
        address,
        jwt
      );

      const cid = uploadResponse.data.Hash;
      setUploadedCID(cid);
      setTextToEncrypt("");

      console.log("✅ Encrypted text uploaded:", cid);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload encrypted text");
    } finally {
      setIsUploading(false);
    }
  };

  // Decrypt text
  const decryptText = async () => {
    if (!jwt || !address || !uploadedCID) {
      setError("No encrypted data to decrypt");
      return;
    }

    try {
      // Fetch encrypted content
      const response = await fetch(
        `https://gateway.lighthouse.storage/ipfs/${uploadedCID}`
      );
      const encryptedData = await response.text();

      // Decrypt using Lighthouse decrypt API
      const decryptResponse = await fetch(
        "https://api.lighthouse.storage/api/decrypt",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            cid: uploadedCID,
          }),
        }
      );

      const decryptedData = await decryptResponse.json();
      alert(`Decrypted text: ${decryptedData.decryptedData || encryptedData}`);
    } catch (err) {
      console.error("Decrypt error:", err);
      setError("Failed to decrypt text");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Encrypted Data Upload
      </h2>

      {/* Wallet Connection */}
      {!address ? (
        <div className="text-center py-8">
          <p className="text-foreground/70 mb-4">
            Connect your wallet to upload encrypted data
          </p>
          <ConnectButton client={client} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Wallet Info */}
          <div className="p-4 bg-background rounded border border-border">
            <p className="text-sm text-foreground/70">Connected Wallet:</p>
            <p className="font-mono text-sm text-foreground break-all">
              {address}
            </p>
          </div>

          {/* Authentication */}
          {!jwt ? (
            <div className="text-center">
              <p className="text-foreground/70 mb-4">
                Authenticate with Lighthouse to enable encryption
              </p>
              <button
                onClick={authenticateWithLighthouse}
                disabled={isAuthenticating}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAuthenticating
                  ? "Authenticating..."
                  : "Authenticate with Lighthouse"}
              </button>
            </div>
          ) : (
            <>
              {/* Upload Section */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Text to Encrypt & Upload
                  </label>
                  <textarea
                    value={textToEncrypt}
                    onChange={(e) => setTextToEncrypt(e.target.value)}
                    placeholder="Enter confidential data here..."
                    className="w-full p-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    rows={6}
                  />
                </div>

                <button
                  onClick={uploadEncryptedText}
                  disabled={isUploading || !textToEncrypt.trim()}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Uploading..." : "Upload Encrypted Data"}
                </button>
              </div>

              {/* Uploaded CID */}
              {uploadedCID && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                    ✅ Successfully Uploaded!
                  </p>
                  <p className="text-xs text-foreground/70 mb-1">CID:</p>
                  <p className="font-mono text-sm text-foreground break-all mb-3">
                    {uploadedCID}
                  </p>
                  <button
                    onClick={decryptText}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:opacity-90"
                  >
                    Decrypt & View
                  </button>
                </div>
              )}
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                ⚠️ {error}
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              ℹ️ Your data is encrypted on upload. Only you (the wallet owner)
              can decrypt it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
