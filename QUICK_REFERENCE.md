# Quick Reference - Proof Verification & IPFS Upload

## What You Can Do Now

### 🔐 Verify Proofs
- ✅ Receive proof from Reclaim Protocol
- ✅ Verify proof structure integrity
- ✅ Extract and validate provider hash
- ✅ Display formatted proof data
- ✅ Run manual hash verification
- ✅ Dummy Chainlink verification

### 📤 Upload to IPFS
- ✅ Upload proof to Lighthouse IPFS
- ✅ Get IPFS hash (Proof ID for blockchain)
- ✅ Generate gateway URL
- ✅ Copy hash to clipboard
- ✅ Open proof on IPFS gateway

### 🎯 Frontend Functions Available

```typescript
// Proof Verification
verifyProofComplete(proof, expectedHash?)
verifyProviderHash(proof, expectedHash?)
verifyProofStructure(proof)
extractProofInfo(proof)

// IPFS Upload
uploadProofToIPFS(proofData, identifier, apiKey)
createIPFSUrl(ipfsHash)
createLighthouseExplorerUrl(ipfsHash)
```

---

## Component Flow

```
User Click "Start Verification"
    ↓
Frontend fetches config from /api/generate-config
    ↓
Reclaim Extension opens → User completes verification
    ↓
Proof sent to /api/receive-proofs
    ↓
Backend verifies and returns proof with providerHash
    ↓
Frontend displays:
  - Proof structure validation ✓/✗
  - Provider hash (clickable to copy)
  - Manual verification button
  - Chainlink verification button
  - Upload to IPFS button
    ↓
User clicks "Upload to IPFS"
    ↓
Frontend uploads to Lighthouse
    ↓
Display:
  - IPFS Hash
  - Gateway URL
  - Copy and Open buttons
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/proofVerification.ts` | Proof validation logic |
| `src/lib/lighthouseUpload.ts` | IPFS upload handler |
| `src/components/StartReclaimVerification.tsx` | Main UI component |
| `src/app/api/receive-proofs/route.ts` | Backend proof handler |
| `src/app/api/generate-config/route.ts` | Config generation |
| `.env` | Environment variables |

---

## Data You Get from IPFS Upload

```json
{
  "success": true,
  "ipfsHash": "QmY77L7JzF8E7Rio...",           // Use for blockchain
  "fileName": "0x67ea7453933ceb...",          // Identifier-based name
  "fileSize": "3000",                         // Bytes
  "url": "https://gateway.lighthouse.storage/ipfs/QmY77L7JzF8E7Rio...",
  "message": "Proof successfully uploaded to IPFS"
}
```

---

## Provider Hash Details

The provider hash is extracted from:
```
proof → claimData → context → providerHash
```

It's a unique fingerprint that:
- ✓ Identifies the specific provider/attestor
- ✓ Ensures proof authenticity
- ✓ Can be verified against expected value
- ✓ Will be used in Chainlink verification

---

## For Chainlink Integration

1. **Get IPFS hash** from upload result
2. **Store hash on-chain** in smart contract
3. **Use Chainlink Function** to verify:
   - Fetch proof from IPFS
   - Verify provider hash matches
   - Update user permissions
4. **Emit event** with verification result

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No proof data" | Click "Start Verification" first |
| IPFS upload fails | Check `NEXT_PUBLIC_LIGHTHOUSE_API_KEY` in .env |
| Proof verification fails | Ensure Zomato provider is authorized |
| Can't receive proof | Verify `NEXT_PUBLIC_BASE_URL` is public (ngrok) |
| Copy button not working | Check browser console for errors |

---

## Environment Check

```bash
# Required variables in .env
✓ NEXT_PUBLIC_BASE_URL          (ngrok URL)
✓ RECLAIM_APP_ID                (Reclaim dashboard)
✓ RECLAIM_APP_SECRET            (Reclaim dashboard)
✓ RECLAIM_PROVIDER_ID           (Zomato: 61fea293...)
✓ NEXT_PUBLIC_LIGHTHOUSE_API_KEY (Lighthouse dashboard)
```

---

## Quick Test

1. Open http://localhost:3000
2. Click "Start Verification"
3. Complete Zomato verification
4. See proof structure validation
5. Click "Upload to IPFS"
6. Copy IPFS hash
7. Done! ✓

---

## Next: Chainlink Integration

Once you have IPFS hash:

```solidity
// Store on blockchain
mapping(address => string) public userProofs;  // ipfsHash
mapping(address => bool) public verified;

// Verify with Chainlink
function verifyProofFromIPFS(string memory ipfsHash) {
  // Fetch proof from IPFS
  // Verify provider hash matches
  // Set verified[msg.sender] = true
}
```

See `IMPLEMENTATION_GUIDE.md` for full details.
