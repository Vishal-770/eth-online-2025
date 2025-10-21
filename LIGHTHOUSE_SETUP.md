# Lighthouse Encrypted Upload Setup

## Overview
This setup enables encrypted data uploads using Lighthouse Storage with Thirdweb wallet authentication. Only wallet-connected users can upload encrypted data, and only they can decrypt it.

## Features
✅ **Wallet-Gated Access**: Only connected wallets can upload  
✅ **End-to-End Encryption**: Data is encrypted before upload  
✅ **JWT Authentication**: Secure session management with Lighthouse  
✅ **Thirdweb v5 Integration**: Modern wallet connection and signing  
✅ **Decryption Support**: Only the wallet owner can decrypt their data  

## Setup Instructions

### 1. Get Your Lighthouse API Key
1. Visit [https://lighthouse.storage](https://lighthouse.storage)
2. Sign up or log in
3. Navigate to your dashboard
4. Copy your API key

### 2. Configure Environment Variables
Open `.env.local` and add your Lighthouse API key:

```env
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_lighthouse_api_key_here
```

### 3. Dependencies
The following packages are already installed:
- `@lighthouse-web3/sdk` - Lighthouse encryption/decryption
- `thirdweb` - Wallet connection and message signing

## How It Works

### Authentication Flow
1. **Connect Wallet**: User connects via Thirdweb
2. **Request Message**: Get authentication message from Lighthouse
3. **Sign Message**: User signs with their wallet
4. **Get JWT**: Lighthouse verifies signature and issues JWT
5. **Store JWT**: JWT stored in localStorage for session persistence

### Upload Flow
1. **User enters text** to encrypt
2. **Lighthouse encrypts** the data
3. **Upload to IPFS** via Lighthouse
4. **Get CID** for the encrypted content

### Decrypt Flow
1. **Fetch encrypted data** from IPFS using CID
2. **Decrypt with JWT** (only wallet owner can decrypt)
3. **Display decrypted content**

## Component Usage

The `LighthouseUpload` component is already integrated into the home page:

```tsx
import LighthouseUpload from "@/components/LighthouseUpload";

export default function Home() {
  return (
    <div>
      <LighthouseUpload />
    </div>
  );
}
```

## Security Features

### Wallet-Based Authentication
- Only wallet owners can authenticate
- Signature verification by Lighthouse
- JWT tied to specific wallet address

### Encryption
- Data encrypted client-side before upload
- AES-256 encryption standard
- Private key derived from wallet signature

### Access Control
- Only the uploading wallet can decrypt
- JWT required for all operations
- Session-based authentication

## API Reference

### Key Methods

#### `authenticateWithLighthouse()`
Authenticates the user with Lighthouse and gets a JWT token.

#### `uploadEncryptedText()`
Encrypts and uploads text to Lighthouse/IPFS.

#### `decryptText()`
Decrypts previously uploaded content (wallet-owner only).

## Troubleshooting

### "Lighthouse API key not found"
- Ensure `.env.local` exists with `NEXT_PUBLIC_LIGHTHOUSE_API_KEY`
- Restart the development server after adding env variables

### "Failed to authenticate"
- Ensure wallet is properly connected
- Check browser console for detailed errors
- Try disconnecting and reconnecting wallet

### "Failed to decrypt"
- Ensure you're using the same wallet that uploaded the data
- Check that JWT is valid (re-authenticate if needed)
- Verify CID is correct

## Next Steps

### Extend to File Uploads
You can extend this to support file uploads:

```typescript
const uploadFile = async (file: File) => {
  const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
  const uploadResponse = await lighthouse.upload(
    file,
    apiKey,
    address,
    jwt
  );
  return uploadResponse.data.Hash;
};
```

### Add Access Control
Integrate with smart contracts for token-gated access:

```typescript
// Only token holders can decrypt
const canDecrypt = await contract.balanceOf(address) > 0;
if (canDecrypt) {
  await decryptText();
}
```

## Resources

- [Lighthouse Documentation](https://docs.lighthouse.storage)
- [Thirdweb Documentation](https://portal.thirdweb.com)
- [IPFS Documentation](https://docs.ipfs.tech)

## Support

For issues or questions:
- Lighthouse: [Discord](https://discord.gg/lighthouse)
- Thirdweb: [Discord](https://discord.gg/thirdweb)
