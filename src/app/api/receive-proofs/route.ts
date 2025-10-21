import { NextResponse } from "next/server";
import { verifyProof } from "@reclaimprotocol/js-sdk";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    console.log("📨 [RECEIVE-PROOFS] Received proof submission request");

    // Step 1: Get raw body exactly like Express docs
    const rawBody = await request.text();
    console.log("📝 [RECEIVE-PROOFS] Raw body length:", rawBody.length);
    console.log("📝 [RECEIVE-PROOFS] Raw body (first 200 chars):", rawBody);

    if (!rawBody || rawBody.length === 0) {
      console.warn("⚠️  [RECEIVE-PROOFS] Empty body received");
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    // Step 2: Decode the URL-encoded body exactly like Express docs
    // const decodedBody = decodeURIComponent(req.body);
    let decodedBody: string;
    try {
      decodedBody = decodeURIComponent(rawBody);
      console.log(
        "🔓 [RECEIVE-PROOFS] Successfully decoded body (first 200 chars):",
        decodedBody
      );
    } catch (decodeError) {
      console.error("❌ [RECEIVE-PROOFS] Failed to decode body:", decodeError);
      return NextResponse.json(
        { error: "Failed to decode request body" },
        { status: 400 }
      );
    }

    // Step 3: Parse JSON exactly like Express docs
    // const proof = JSON.parse(decodedBody);
    let proof;
    try {
      proof = JSON.parse(decodedBody);
      console.log("✅ [RECEIVE-PROOFS] Successfully parsed proof JSON");
      console.log(
        "🔑 [RECEIVE-PROOFS] Proof top-level keys:",
        Object.keys(proof)
      );

      // Pretty print the entire proof object
      console.log("\n📋 [RECEIVE-PROOFS] ===== FULL PROOF OBJECT =====");
      console.log(JSON.stringify(proof, null, 2));
      console.log("===== END PROOF OBJECT =====\n");
    } catch (parseError) {
      console.error("❌ [RECEIVE-PROOFS] Failed to parse JSON:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON format", details: String(parseError) },
        { status: 400 }
      );
    }

    // Log proof structure
    console.log("� [RECEIVE-PROOFS] Proof structure:");
    console.log("  - identifier:", !!proof?.identifier);
    console.log("  - claimData:", !!proof?.claimData);
    console.log(
      "  - signatures:",
      Array.isArray(proof?.signatures) ? proof.signatures.length : 0
    );
    console.log(
      "  - witnesses:",
      Array.isArray(proof?.witnesses) ? proof.witnesses.length : 0
    );
    console.log("  - publicData:", !!proof?.publicData);

    // Step 4: Verify the proof exactly like Express docs
    // const result = await verifyProof(proof)
    console.log("🔍 [RECEIVE-PROOFS] Starting proof verification...");
    let result: boolean;

    try {
      result = await verifyProof(proof);
      console.log(
        "✅ [RECEIVE-PROOFS] Verification completed. Result:",
        result
      );
    } catch (verifyError) {
      console.error(
        "❌ [RECEIVE-PROOFS] Verification threw error:",
        verifyError
      );
      if (verifyError instanceof Error) {
        console.error("  Error message:", verifyError.message);
        console.error("  Error name:", verifyError.name);
        console.error("  Stack:", verifyError.stack?.substring(0, 300));
      }
      // Don't return early - log what we got
      result = false;
    }

    // Step 5: Check verification result exactly like Express docs
    // if (!result) {
    //   return res.status(400).json({ error: 'Invalid proofs data' });
    // }
    if (!result) {
      console.warn(
        "⚠️  [RECEIVE-PROOFS] Verification failed - result is false"
      );
      console.warn("⚠️  [RECEIVE-PROOFS] This typically means:");
      console.warn("    - Attestor signature is invalid");
      console.warn("    - Proof was tampered with");
      console.warn("    - Provider is not authorized");

      // Log the proof for debugging
      console.log(
        "🔧 [RECEIVE-PROOFS] Full proof for debugging:",
        JSON.stringify(proof, null, 2).substring(0, 500)
      );

      // For now, return 400 like the docs, but log everything
      return NextResponse.json(
        { error: "Invalid proofs data" },
        { status: 400 }
      );
    }

    // Step 6: Success - log everything and process
    console.log("✅ [RECEIVE-PROOFS] Proof verification SUCCESSFUL");

    // Pretty print the successful proof
    console.log("\n✅ [RECEIVE-PROOFS] ===== VERIFIED PROOF OBJECT =====");
    console.log(JSON.stringify(proof, null, 2));
    console.log("===== END VERIFIED PROOF =====\n");

    // Extract useful information
    const userid = proof?.publicData?.userid;
    const provider = proof?.claimData?.provider;
    const timestamp = proof?.claimData?.timestampS;

    console.log("📌 [RECEIVE-PROOFS] Extracted information:");
    console.log("  - User ID:", userid);
    console.log("  - Provider:", provider);
    console.log("  - Timestamp:", timestamp);
    console.log("  - Identifier:", proof?.identifier);
    console.log("  - Signatures count:", proof?.signatures?.length || 0);
    console.log("  - Witnesses count:", proof?.witnesses?.length || 0);

    // Process the proofs here (e.g., store in database)
    console.log("✅ [RECEIVE-PROOFS] Processing proof...");

    // Extract provider hash from context
    let providerHash = null;
    try {
      const context = JSON.parse(proof?.claimData?.context || "{}");
      providerHash = context?.providerHash;
      console.log("📍 [RECEIVE-PROOFS] Provider Hash:", providerHash);
    } catch {
      console.warn("⚠️  [RECEIVE-PROOFS] Could not extract provider hash");
    }

    return NextResponse.json({
      success: true,
      message: "Proof verified successfully",
      identifier: proof?.identifier,
      userid: userid,
      provider: provider,
      timestamp: timestamp,
      providerHash: providerHash,
      fullProof: proof, // Send complete proof to frontend for verification
    });
  } catch (error) {
    console.error("❌ [RECEIVE-PROOFS] Unexpected error:", error);
    if (error instanceof Error) {
      console.error("  Error message:", error.message);
      console.error("  Error name:", error.name);
    }

    return NextResponse.json(
      {
        error: "Failed to process proof",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
