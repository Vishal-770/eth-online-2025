import lighthouse from "@lighthouse-web3/sdk";

export interface LighthouseUploadResponse {
  data: {
    Name: string;
    Hash: string;
    Size: string;
  };
}

export interface IPFSUploadResult {
  success: boolean;
  ipfsHash: string;
  fileName: string;
  fileSize: string;
  url: string;
  message: string;
}

/**
 * Upload proof data to Lighthouse IPFS
 * @param proofData - The proof object to upload
 * @param identifier - Unique identifier (proof identifier)
 * @param apiKey - Lighthouse API key
 * @returns Upload result with IPFS hash
 */
export async function uploadProofToIPFS(
  proofData: unknown,
  identifier: string,
  apiKey: string
): Promise<IPFSUploadResult> {
  try {
    if (!apiKey) {
      throw new Error("Lighthouse API key is not configured");
    }

    if (!identifier) {
      throw new Error("Proof identifier is required");
    }

    // Convert proof to JSON string (encrypted/encoded)
    const proofText = JSON.stringify(proofData);

    // Use identifier as the file name
    const fileName = identifier.substring(0, 50); // Truncate to reasonable length

    console.log("📤 [LIGHTHOUSE] Starting IPFS upload...");
    console.log("  - File Name:", fileName);
    console.log("  - Data Size:", proofText.length, "bytes");

    // Upload to Lighthouse
    const response = (await lighthouse.uploadText(
      proofText,
      apiKey,
      fileName
    )) as LighthouseUploadResponse;

    if (!response?.data?.Hash) {
      throw new Error("Failed to get IPFS hash from Lighthouse");
    }

    const ipfsHash = response.data.Hash;
    const ipfsUrl = `https://gateway.lighthouse.storage/ipfs/${ipfsHash}`;

    console.log("✅ [LIGHTHOUSE] Upload successful!");
    console.log("  - IPFS Hash:", ipfsHash);
    console.log("  - IPFS URL:", ipfsUrl);

    return {
      success: true,
      ipfsHash,
      fileName: response.data.Name,
      fileSize: response.data.Size,
      url: ipfsUrl,
      message: "Proof successfully uploaded to IPFS",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ [LIGHTHOUSE] Upload failed:", errorMessage);

    return {
      success: false,
      ipfsHash: "",
      fileName: "",
      fileSize: "",
      url: "",
      message: `Upload failed: ${errorMessage}`,
    };
  }
}

/**
 * Create IPFS gateway URL
 * @param ipfsHash - IPFS hash
 * @returns Full IPFS gateway URL
 */
export function createIPFSUrl(ipfsHash: string): string {
  return `https://gateway.lighthouse.storage/ipfs/${ipfsHash}`;
}

/**
 * Create Lighthouse explorer URL
 * @param ipfsHash - IPFS hash
 * @returns Lighthouse explorer URL
 */
export function createLighthouseExplorerUrl(ipfsHash: string): string {
  return `https://files.lighthouse.storage/${ipfsHash}`;
}
