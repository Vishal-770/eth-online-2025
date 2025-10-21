# Reclaim Protocol + Lighthouse IPFS Integration

## Complete Flow Overview

### 1. **Proof Generation & Verification**
- User clicks "Start Verification" button
- Backend generates Reclaim proof request config with provider credentials
- Frontend triggers Reclaim verification flow (browser extension/mobile)
- User completes verification with the provider (e.g., Zomato, YouTube, etc.)

### 2. **Proof Reception & Server Verification**
- Proof is sent to `/api/receive-proofs` endpoint
- Backend:
  - Decodes URL-encoded body
  - Parses JSON proof structure
  - Verifies proof signature with `verifyProof()` SDK
  - Extracts provider hash from proof context
  - Returns verified proof with IPFS-ready data

### 3. **Frontend Proof Verification**
- Component receives verified proof data
- Frontend performs structural verification:
  - ✓ Checks identifier exists
  - ✓ Validates claim data structure
  - ✓ Verifies signatures and witnesses
  - ✓ Confirms public data presence
  - ✓ Validates provider hash integrity

### 4. **IPFS Upload (Lighthouse)**
- User clicks "Upload to IPFS" button
- Frontend converts proof to JSON string
- Uploads to Lighthouse using proof identifier as filename
- Returns IPFS hash and gateway URL

### 5. **Frontend Display & Interaction**
- Shows IPFS hash (Proof ID on blockchain)
- Shows gateway URL for accessing proof data
- Copy buttons for hash and URL
- Direct link to access proof on IPFS gateway

---

## File Structure

```
src/
├── components/
│   └── StartReclaimVerification.tsx      # Main verification component with IPFS upload UI
├── lib/
│   ├── proofVerification.ts               # Proof verification utilities
│   └── lighthouseUpload.ts                # Lighthouse IPFS upload functionality
├── app/
│   ├── api/
│   │   ├── generate-config/route.ts       # Generate Reclaim proof request config
│   │   └── receive-proofs/route.ts        # Receive and verify proofs
│   ├── layout.tsx                         # Root layout with providers
│   ├── page.tsx                           # Home page
│   └── globals.css                        # Global styles and CSS variables
├── constants/
│   └── providers.id.ts                    # Provider ID mappings
└── .env                                   # Environment variables
```

---

## Key Features Implemented

### ✅ Proof Verification Functions
```typescript
verifyProofComplete(proof, expectedHash?)
  - Structure validation
  - Provider hash verification
  - Complete proof integrity check

verifyProviderHash(proof, expectedHash?)
  - Extracts hash from proof context
  - Validates hash presence and format
  - Compares with expected value

verifyProofStructure(proof)
  - Validates all required fields
  - Checks data integrity
  - Reports any issues
```

### ✅ IPFS Upload Functionality
```typescript
uploadProofToIPFS(proofData, identifier, apiKey)
  - Converts proof to JSON
  - Uploads to Lighthouse gateway
  - Uses identifier as filename
  - Returns IPFS hash and gateway URL

createIPFSUrl(ipfsHash)
  - Generates Lighthouse gateway URL

createLighthouseExplorerUrl(ipfsHash)
  - Generates explorer link
```

### ✅ Frontend UI Components
- **Verification Status Card**: Shows overall proof validation status
- **Structure Verification**: Displays all proof component checks (✓/✗)
- **Provider Hash Display**: Shows hash with copy-to-clipboard
- **Verification Buttons**:
  - Manual Verification
  - Chainlink Verification (dummy)
  - Upload to IPFS
- **IPFS Result Card**: Shows hash, URL, file info, and action buttons

---

## API Endpoints

### POST `/api/generate-config`
**Purpose**: Generate Reclaim proof request configuration
**Response**:
```json
{
  "reclaimProofRequestConfig": "base64-encoded-config"
}
```

### POST `/api/receive-proofs`
**Purpose**: Receive and verify proof from Reclaim
**Body**: URL-encoded proof JSON
**Response** (Success):
```json
{
  "success": true,
  "message": "Proof verified successfully",
  "identifier": "0x...",
  "userid": "user123",
  "provider": "http",
  "timestamp": 1760867775,
  "providerHash": "0x...",
  "fullProof": { /* complete proof object */ }
}
```

---

## Environment Variables

```bash
# Base URL for proof callback (must be public for mobile)
NEXT_PUBLIC_BASE_URL=https://your-ngrok-url

# Reclaim Protocol
RECLAIM_APP_ID=0x...
RECLAIM_APP_SECRET=0x...
RECLAIM_PROVIDER_ID=61fea293-73bc-495c-9354-c2f61294fc30

# Lighthouse IPFS (publicly accessible for frontend)
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your-api-key

# Thirdweb (for wallet connection)
NEXT_PUBLIC_THIRD_WEB_SECRET="..."
NEXT_PUBLIC_THIRD_WEB_CLIENT_ID="..."
```

---

## Usage Flow

1. **User initiates verification**
   ```
   Start Verification → Reclaim Extension → Provider Auth
   ```

2. **Backend processes proof**
   ```
   Proof received → Decode → Parse → Verify signature → Extract hash
   ```

3. **Frontend verifies proof**
   ```
   Check structure → Validate hash → Run manual verification
   ```

4. **Upload to IPFS**
   ```
   Click "Upload to IPFS" → Lighthouse upload → Get IPFS hash
   ```

5. **Share proof data**
   ```
   IPFS Hash → Gateway URL → Copy & Share
   ```

---

## Proof Data Structure

The complete proof contains:

```typescript
{
  identifier: "0x...",                    // Unique proof ID
  claimData: {
    provider: "http",                     // Data source type
    parameters: "...",                    // Request parameters
    owner: "0x...",                       // Proof owner wallet
    timestampS: 1760867775,               // Timestamp
    context: "...",                       // Proof context with providerHash
    identifier: "0x...",                  // Claim ID
    epoch: 1                              // Epoch number
  },
  signatures: ["0x..."],                  // Proof signatures
  witnesses: [{                           // Attestors
    id: "0x...",
    url: "wss://..."
  }],
  publicData: {                           // Extracted public data
    userid: "...",
    orders: [],
    followers: 0,
    // ... provider-specific data
  }
}
```

---

## IPFS Upload Response

```typescript
{
  success: true,
  ipfsHash: "QmY77L7JzF8E7Rio4XboEpXL2kTZnW2oBFdzm6c53g5ay8",
  fileName: "0x67ea7453933ceb",
  fileSize: "3000",
  url: "https://gateway.lighthouse.storage/ipfs/QmY77L7JzF8E7Rio4XboEpXL2kTZnW2oBFdzm6c53g5ay8",
  message: "Proof successfully uploaded to IPFS"
}
```

---

## Next Steps

1. **Smart Contract Integration**
   - Store IPFS hash on-chain
   - Create Chainlink function to verify proof
   - Update user permissions based on proof

2. **Proof Storage**
   - Save proofs to database (Prisma + PostgreSQL)
   - Create `/proofs` endpoint to retrieve past proofs
   - Add proof history tracking

3. **Advanced Features**
   - Multiple provider support
   - Batch proof verification
   - Proof expiration handling
   - User reputation system

4. **Security**
   - Rate limiting on endpoints
   - CORS configuration
   - Proof expiry validation
   - Tamper detection

---

## Testing Checklist

- [ ] Click "Start Verification" button
- [ ] Complete Zomato/YouTube verification
- [ ] Verify proof received in console
- [ ] Check proof structure validation passes
- [ ] Click "Manual Verification" - should show success
- [ ] Click "Upload to IPFS" - should show IPFS hash
- [ ] Copy IPFS hash - should work
- [ ] Click "Open" - should open in gateway
- [ ] Click "Chainlink Verification" - should work
- [ ] Check proof data displays correctly in Complete Proof Data section

---

## Debugging

**Check console logs:**
- `[RECEIVE-PROOFS]` - Backend proof reception logs
- `[LIGHTHOUSE]` - IPFS upload logs
- Manual verification output in console

**Common issues:**
- API key not configured: Check `NEXT_PUBLIC_LIGHTHOUSE_API_KEY`
- Upload fails: Verify Lighthouse API key is valid
- Proof verification fails: Check provider is authorized in Reclaim
- Can't receive proof: Ensure `NEXT_PUBLIC_BASE_URL` is public (ngrok)
