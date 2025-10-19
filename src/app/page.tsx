import StartReclaimVerification from "@/components/StartReclaimVerification";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Reclaim Protocol Verification
          </h1>
          <p className="text-lg text-foreground/70">
            Securely verify your credentials with Reclaim Protocol
          </p>
        </div>

        {/* Main Content */}
        <div className="flex justify-center">
          <StartReclaimVerification />
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
          </p>
        </div>
      </div>
    </div>
  );
}
