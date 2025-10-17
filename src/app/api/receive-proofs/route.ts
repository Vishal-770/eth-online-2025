import { NextResponse } from "next/server";
import { verifyProof } from "@reclaimprotocol/js-sdk";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    console.log("📨 Received proof submission request");

    // Get the raw body as text (Reclaim sends it URL-encoded)
    const rawBody = await request.text();
    console.log("📝 Raw body received:", rawBody.substring(0, 200));

    // Decode the URL-encoded body
    const decodedBody = decodeURIComponent(rawBody);
    console.log("🔓 Decoded body:", decodedBody.substring(0, 200));

    // Parse the JSON
    const proof = JSON.parse(decodedBody);
    console.log("✅ Successfully parsed proof object");

    // Verify the proof using the SDK verifyProof function
    const result = await verifyProof(proof);

    if (!result) {
      console.warn("⚠️  Proof verification failed - Invalid proofs data");
      return NextResponse.json(
        { error: "Invalid proofs data" },
        { status: 400 }
      );
    }

    console.log("✅ Proof verified successfully!");
    console.log("Proof claims:", proof?.claimData?.identifier);

    // Process the proofs here (e.g., store in database, authenticate user, etc.)
    return NextResponse.json({
      success: true,
      message: "Proof verified successfully",
      identifier: proof?.claimData?.identifier,
    });
  } catch (error) {
    console.error("❌ Error verifying proof:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", errorMessage);

    return NextResponse.json(
      {
        error: "Failed to verify proof",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
