import { NextResponse } from "next/server";
import { ReclaimProofRequest } from "@reclaimprotocol/js-sdk";

// Force Next to treat this as dynamic (no static caching)
export const dynamic = "force-dynamic";

// Read credentials from environment variables
const APP_ID = process.env.RECLAIM_APP_ID;
const APP_SECRET = process.env.RECLAIM_APP_SECRET;
const PROVIDER_ID = process.env.RECLAIM_PROVIDER_ID;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function GET(): Promise<NextResponse> {
  try {
    if (!APP_ID || !APP_SECRET || !PROVIDER_ID) {
      return NextResponse.json(
        {
          error:
            "Missing Reclaim configuration. Please set RECLAIM_APP_ID, RECLAIM_APP_SECRET, and RECLAIM_PROVIDER_ID in your environment.",
        },
        { status: 500 }
      );
    }

    console.log("Initializing Reclaim with:");
    console.log("- APP_ID:", APP_ID.substring(0, 10) + "...");
    console.log("- PROVIDER_ID:", PROVIDER_ID);
    console.log("- BASE_URL:", BASE_URL);

    const reclaimProofRequest = await ReclaimProofRequest.init(
      APP_ID,
      APP_SECRET,
      PROVIDER_ID
    );

    // Set callback endpoint for receiving proofs
    reclaimProofRequest.setAppCallbackUrl(`${BASE_URL}/api/receive-proofs`);

    const reclaimProofRequestConfig = reclaimProofRequest.toJsonString();

    console.log("✅ Successfully generated Reclaim config");
    return NextResponse.json({ reclaimProofRequestConfig });
  } catch (error) {
    console.error("Error generating request config:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : String(error)
    );
    return NextResponse.json(
      {
        error: "Failed to generate request config",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
