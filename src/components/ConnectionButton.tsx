"use client";
import client from "@/lib/client";
import { useTheme } from "next-themes";
import React from "react";
import { sepolia } from "thirdweb/chains";
import { ConnectButton, darkTheme, lightTheme } from "thirdweb/react";
import { createWallet } from "thirdweb/wallets";
const WalletConnectionButton = () => {
  const { theme } = useTheme();
  return (
    <>
      <ConnectButton
        client={client}
        theme={theme === "light" ? lightTheme() : darkTheme()}
        wallets={[
          createWallet("io.metamask"),
          createWallet("com.coinbase.wallet"),
          createWallet("me.rainbow"),
        ]}
        chain={sepolia}
      />
    </>
  );
};

export default WalletConnectionButton;
