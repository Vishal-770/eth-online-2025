import IntegratedVerification from "@/components/IntegratedVerification";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Secure Credential Verification
          </h1>
          <p className="text-lg text-foreground/70">
            Verify credentials with Reclaim Protocol & store encrypted proofs on
            IPFS
          </p>
        </div>

        {/* Main Content */}
        <div className="flex justify-center">
          <IntegratedVerification />
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-sm text-foreground/60">
          <p>
            Powered by{" "}
            <a
              href="https://reclaimprotocol.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Reclaim Protocol
            </a>
            {" & "}
            <a
              href="https://lighthouse.storage"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Lighthouse Storage
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
