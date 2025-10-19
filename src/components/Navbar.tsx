"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import WalletConnectionButton from "@/components/ConnectionButton";
import { SingleClickModeToggle } from "@/components/ModeToggle";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">
                  R
                </span>
              </div>
              <span className="text-xl font-bold text-foreground hidden sm:inline">
                Reclaim
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              Home
            </Link>
            <Link
              href="/proofs"
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              Proofs
            </Link>
            <Link
              href="/docs"
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              Documentation
            </Link>
            <a
              href="https://github.com/Vishal-770/eth-online-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 hover:text-foreground transition-colors font-medium"
            >
              GitHub
            </a>
          </div>

          {/* Desktop CTA Button */}
          <div className="hidden md:flex items-center gap-3">
            <SingleClickModeToggle />
            <WalletConnectionButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors"
              aria-expanded="false"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/proofs"
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Proofs
            </Link>
            <Link
              href="/docs"
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Documentation
            </Link>
            <a
              href="https://github.com/Vishal-770/eth-online-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-base font-medium text-foreground/70 hover:text-foreground hover:bg-secondary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              GitHub
            </a>
            <div className="px-3 py-2 space-y-2 border-t border-border mt-2">
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-foreground/70">Theme</span>
                <SingleClickModeToggle />
              </div>
              <div className="pb-2">
                <WalletConnectionButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
