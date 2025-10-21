/**
 * Proof Verification Utility
 * Verifies proof integrity and authenticity on the frontend
 */

export interface ProofData {
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

export interface VerifiedProofResponse {
  success: boolean;
  message: string;
  identifier: string;
  userid: string;
  provider: string;
  timestamp: number;
  providerHash: string;
  fullProof: ProofData;
  ipfsUpload?: {
    success: boolean;
    ipfsHash: string;
    fileName: string;
    fileSize: string;
    url: string;
    message: string;
  };
}

/**
 * Verify that the proof's provider hash matches expected value
 * @param proof - The proof to verify
 * @param expectedHash - Expected provider hash (optional - for comparison)
 * @returns Hash verification result
 */
export function verifyProviderHash(
  proof: ProofData,
  expectedHash?: string
): {
  isValid: boolean;
  hash: string | null;
  message: string;
} {
  try {
    // Extract provider hash from context
    const context = JSON.parse(proof?.claimData?.context || "{}");
    const providerHash = context?.providerHash;

    if (!providerHash) {
      return {
        isValid: false,
        hash: null,
        message: "Provider hash not found in proof context",
      };
    }

    // If expected hash is provided, verify it matches
    if (expectedHash && providerHash !== expectedHash) {
      return {
        isValid: false,
        hash: providerHash,
        message: `Provider hash mismatch: expected ${expectedHash}, got ${providerHash}`,
      };
    }

    return {
      isValid: true,
      hash: providerHash,
      message: "Provider hash verified successfully",
    };
  } catch (error) {
    return {
      isValid: false,
      hash: null,
      message: `Failed to verify provider hash: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/**
 * Verify overall proof structure and integrity
 * @param proof - The proof to verify
 * @returns Proof verification result
 */
export function verifyProofStructure(proof: ProofData): {
  isValid: boolean;
  issues: string[];
  details: {
    hasIdentifier: boolean;
    hasClaimData: boolean;
    hasSignatures: boolean;
    hasWitnesses: boolean;
    hasPublicData: boolean;
    signatureCount: number;
    witnessCount: number;
  };
} {
  const issues: string[] = [];

  // Check required fields
  if (!proof?.identifier) {
    issues.push("Missing identifier");
  }

  if (!proof?.claimData) {
    issues.push("Missing claimData");
  }

  if (!Array.isArray(proof?.signatures) || proof.signatures.length === 0) {
    issues.push("Missing or empty signatures");
  }

  if (!Array.isArray(proof?.witnesses) || proof.witnesses.length === 0) {
    issues.push("Missing or empty witnesses");
  }

  if (!proof?.publicData) {
    issues.push("Missing publicData");
  }

  // Verify claim data structure
  if (proof?.claimData) {
    if (!proof.claimData.provider) {
      issues.push("Missing claimData.provider");
    }
    if (!proof.claimData.context) {
      issues.push("Missing claimData.context");
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    details: {
      hasIdentifier: !!proof?.identifier,
      hasClaimData: !!proof?.claimData,
      hasSignatures: Array.isArray(proof?.signatures),
      hasWitnesses: Array.isArray(proof?.witnesses),
      hasPublicData: !!proof?.publicData,
      signatureCount: Array.isArray(proof?.signatures)
        ? proof.signatures.length
        : 0,
      witnessCount: Array.isArray(proof?.witnesses)
        ? proof.witnesses.length
        : 0,
    },
  };
}

/**
 * Complete proof verification combining multiple checks
 * @param proof - The proof to verify
 * @param expectedProviderHash - Expected provider hash for comparison (optional)
 * @returns Complete verification result
 */
export function verifyProofComplete(
  proof: ProofData,
  expectedProviderHash?: string
): {
  isValid: boolean;
  verification: {
    structure: ReturnType<typeof verifyProofStructure>;
    providerHash: ReturnType<typeof verifyProviderHash>;
  };
  summary: string;
} {
  const structureVerification = verifyProofStructure(proof);
  const hashVerification = verifyProviderHash(proof, expectedProviderHash);

  const isValid = structureVerification.isValid && hashVerification.isValid;

  let summary = "";
  if (isValid) {
    summary = "✅ Proof is valid and verified. No tampering detected.";
  } else {
    const issues = [
      ...structureVerification.issues,
      ...(hashVerification.isValid ? [] : [hashVerification.message]),
    ];
    summary = `❌ Proof verification failed: ${issues.join("; ")}`;
  }

  return {
    isValid,
    verification: {
      structure: structureVerification,
      providerHash: hashVerification,
    },
    summary,
  };
}

/**
 * Extract useful information from proof
 * @param proof - The proof to extract from
 * @returns Extracted proof information
 */
export function extractProofInfo(proof: ProofData): {
  identifier: string;
  provider: string;
  timestamp: number;
  owner: string;
  publicDataKeys: string[];
} {
  return {
    identifier: proof?.identifier || "N/A",
    provider: proof?.claimData?.provider || "N/A",
    timestamp: proof?.claimData?.timestampS || 0,
    owner: proof?.claimData?.owner || "N/A",
    publicDataKeys: Object.keys(proof?.publicData || {}),
  };
}
