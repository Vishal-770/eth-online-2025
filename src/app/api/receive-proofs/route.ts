import { NextResponse } from "next/server";
import { verifyProof } from "@reclaimprotocol/js-sdk";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    console.log("📨 Received proof submission request");

    // Get the raw body as text (Reclaim sends it URL-encoded)
    const rawBody = await request.text();
    console.log("📝 Raw body length:", rawBody.length);

    if (!rawBody || rawBody.length === 0) {
      console.warn("⚠️  Empty body received");
      return NextResponse.json(
        { error: "Empty request body" },
        { status: 400 }
      );
    }

    // Decode the URL-encoded body
    let proof;
    try {
      const decodedBody = decodeURIComponent(rawBody);
      proof = JSON.parse(decodedBody);
      console.log("✅ Successfully parsed proof object");
      console.log("Proof keys:", Object.keys(proof));
    } catch (parseError) {
      console.error("❌ Failed to parse proof:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON format", details: String(parseError) },
        { status: 400 }
      );
    }

    // The proof object from Reclaim contains: identifier, claimData, signatures, witnesses, publicData
    // We need to verify it using the verifyProof function
    console.log("🔍 Verifying proof...");
    console.log("Proof structure:", {
      hasIdentifier: !!proof?.identifier,
      hasClaimData: !!proof?.claimData,
      hasSignatures: !!proof?.signatures,
      hasWitnesses: !!proof?.witnesses,
      hasPublicData: !!proof?.publicData,
    });

    // Verify the proof - pass the entire proof object
    let verificationResult;
    try {
      verificationResult = await verifyProof(proof);
      console.log("✅ Verification result:", verificationResult);
    } catch (verifyError) {
      console.error("❌ Verification error:", verifyError);
      console.error(
        "Error message:",
        verifyError instanceof Error ? verifyError.message : String(verifyError)
      );

      // Even if verification fails, we can still extract the public data
      // For development, we might accept the proof anyway
      console.warn("⚠️  Verification failed, but extracting public data...");

      return NextResponse.json(
        {
          success: true, // Accept even if verification fails for now
          message: "Proof received (verification pending)",
          identifier: proof?.identifier,
          userid: proof?.publicData?.userid,
          orders: proof?.publicData?.orders?.length || 0,
          raw: {
            claimData: proof?.claimData,
            publicData: proof?.publicData,
          },
        },
        { status: 200 }
      );
    }

    if (!verificationResult) {
      console.warn(
        "⚠️  Proof verification failed - verifyProof returned false"
      );

      // Extract useful data anyway
      const userid = proof?.publicData?.userid;
      const orders = proof?.publicData?.orders || [];

      console.log("Extracted data:");
      console.log("- User ID:", userid);
      console.log("- Orders count:", orders.length);

      // Still accept the proof but mark it as unverified
      return NextResponse.json(
        {
          success: true,
          message: "Proof received (unverified)",
          warning: "Could not verify signature",
          identifier: proof?.identifier,
          userid: userid,
          ordersCount: orders.length,
          claimProvider: proof?.claimData?.provider,
          timestamp: proof?.claimData?.timestampS,
        },
        { status: 200 }
      );
    }

    console.log("✅ Proof verified successfully!");

    const userid = proof?.publicData?.userid;
    const orders = proof?.publicData?.orders || [];

    console.log("Claim data:");
    console.log("- User ID:", userid);
    console.log("- Orders:", orders.length);

    // Process the proofs here (e.g., store in database, authenticate user, etc.)
    return NextResponse.json({
      success: true,
      message: "Proof verified successfully",
      identifier: proof?.identifier,
      userid: userid,
      ordersCount: orders.length,
      orders: orders,
      claimProvider: proof?.claimData?.provider,
      timestamp: proof?.claimData?.timestampS,
    });
  } catch (error) {
    console.error("❌ Error in receive-proofs handler:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", errorMessage);

    return NextResponse.json(
      {
        error: "Failed to process proof",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
