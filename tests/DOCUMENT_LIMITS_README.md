# Document Upload Limits Test Suite

This test suite verifies that document upload limits are properly enforced based on subscription tiers in the LegalynX application.

## Subscription Tiers & Limits

| Plan | Document Limit | Storage Limit |
|------|----------------|---------------|
| **BASIC** | 5 documents | 100 MB |
| **STANDARD** | 20 documents | 1 GB |
| **PREMIUM** | Unlimited | 10 GB |

## Files Created

### Core Implementation
- `src/lib/document-limits.ts` - Utility class for checking document limits
- `src/app/backend/api/documents/limits/route.ts` - API endpoint to check limits
- Updated `src/app/backend/api/documents/upload/route.ts` - Added limit enforcement

### Testing
- `tests/document-limits-test.js` - Comprehensive test suite
- `run-document-limits-test.bat` - Windows test runner
- `run-document-limits-test.sh` - Unix/Linux test runner

## How to Run Tests

### Option 1: Using npm script
```bash
npm run test-document-limits
```

### Option 2: Using test runners
**Windows:**
```cmd
run-document-limits-test.bat
```

**Unix/Linux/macOS:**
```bash
./run-document-limits-test.sh
```

### Option 3: Direct execution
```bash
node tests/document-limits-test.js
```

## What the Tests Do

1. **Creates test users** for each subscription tier (BASIC, STANDARD, PREMIUM)
2. **Uses real PDF files** from the `src/app/backend/sample_docs/` directory
3. **Tests document upload limits** by attempting to upload actual PDF files via API
4. **Validates the DocumentLimitChecker utility** functions work correctly
5. **Verifies limit enforcement** at the boundary conditions with real uploads
6. **Supports both API and database-only testing modes**
7. **Cleans up test data** automatically after completion

## Test Scenarios

### BASIC Plan Tests
- ✅ Upload 4 documents (should succeed)
- ✅ Upload 5 documents (should succeed - at limit)
- ❌ Upload 6 documents (should fail - over limit)

### STANDARD Plan Tests
- ✅ Upload 19 documents (should succeed)
- ✅ Upload 20 documents (should succeed - at limit)
- ❌ Upload 21 documents (should fail - over limit)

### PREMIUM Plan Tests
- ✅ Upload 5, 10, 20, 25 documents (all should succeed - unlimited)

## API Integration

### Check User's Document Limits
```javascript
// GET /backend/api/documents/limits
// Headers: Authorization: Bearer <token>

// Response:
{
  "success": true,
  "limits": {
    "maxDocuments": 5,
    "currentCount": 3,
    "canUpload": true,
    "planType": "BASIC"
  },
  "message": "3/5 documents used",
  "upgradeRequired": false
}
```

### Upload Document with Limit Check
The upload API (`/backend/api/documents/upload`) now automatically checks document limits before allowing uploads:

```javascript
// If limit exceeded, returns:
{
  "error": "Document limit reached. Your BASIC plan allows 5 documents. You currently have 5 documents. Please delete some files or upgrade your plan.",
  "currentCount": 5,
  "maxDocuments": 5,
  "planType": "BASIC"
}
// HTTP Status: 429 (Too Many Requests)
```

## Using the DocumentLimitChecker Utility

```typescript
import { DocumentLimitChecker } from '@/lib/document-limits';

// Check if user can upload more documents
const limits = await DocumentLimitChecker.canUserUploadDocument(userId);
console.log(limits);
// {
//   maxDocuments: 5,
//   currentCount: 3,
//   canUpload: true,
//   planType: 'BASIC'
// }

// Get detailed limits info for display
const info = await DocumentLimitChecker.getDocumentLimitsInfo(userId);
console.log(info.message); // "3/5 documents used"
```

## Test Modes

### API Testing Mode (Default)
Tests actual document uploads via the API endpoint. Requires the Next.js server to be running on `localhost:3000`.

### Database-Only Mode
Tests document limits by creating database entries directly. Use this when the server isn't running:
```bash
TEST_WITH_API=false npm run test-document-limits
```

## Expected Test Output

```
🚀 Starting Document Limits Test Suite with Real PDFs
============================================================
📁 Found 27 sample PDF files
🌐 Testing with real API uploads (requires server running on localhost:3000)
   To test database-only: set TEST_WITH_API=false

🧪 Testing BASIC plan limits...
👤 Created test user: test-basic-abc123@example.com
📊 Expected limit: 5 documents

📋 Testing 4 documents upload...
📤 Attempting to upload 4 documents for user test-user-basic-abc123
  📄 Uploading 1/4: 20210112_CaseDigest.pdf
    ✅ Upload successful
  📄 Uploading 2/4: 20241105_ResignationLetter.pdf
    ✅ Upload successful
  📄 Uploading 3/4: Vol.65-Recent-Jurisprudence_2020-2021.pdf
    ✅ Upload successful
  📄 Uploading 4/4: 20250909_AppellantBrief_Page_1.pdf
    ✅ Upload successful
📈 Upload results: 4 successful, 0 limit-blocked
✅ 4 documents: FULLY ALLOWED (Expected)

📋 Testing 6 documents upload...
📤 Attempting to upload 6 documents for user test-user-basic-abc123
  📄 Uploading 1/6: 20210112_CaseDigest.pdf
    ✅ Upload successful
  📄 Uploading 2/6: 20241105_ResignationLetter.pdf
    ❌ Upload failed: Document limit reached. Your BASIC plan allows 5 documents...
    🛑 Document limit reached (expected for limit testing)
📈 Upload results: 5 successful, 1 limit-blocked
✅ 6 documents: BLOCKED AT LIMIT (Expected)

🧹 Cleaned up test user: test-basic-abc123@example.com

🔧 Testing DocumentLimitChecker utility...
✅ BASIC with 0 docs: canUpload=true (Expected)
✅ BASIC with 2 docs: canUpload=true (Expected)
✅ STANDARD with 8 docs: canUpload=true (Expected)
✅ PREMIUM with 8 docs: canUpload=true (Expected)

============================================================
✅ All tests completed successfully!
📋 Test Summary:
   • BASIC: 5 documents maximum
   • STANDARD: 20 documents maximum
   • PREMIUM: Unlimited documents
   • Used 27 sample PDF files from sample_docs/
   • Tested real API upload endpoints
```

## Troubleshooting

### Database Connection Issues
Make sure your `.env` file has the correct `DATABASE_URL` and that your database is running.

### Test Failures
If tests fail, check:
1. Database connectivity
2. Prisma schema is up to date (`npx prisma generate`)
3. No existing test data conflicts
4. Environment variables are set correctly

### Permission Issues (Unix/Linux)
If the shell script isn't executable:
```bash
chmod +x run-document-limits-test.sh
```

## Integration with Frontend

To display document limits in your frontend:

```typescript
// Fetch user's document limits
const response = await fetch('/backend/api/documents/limits', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const data = await response.json();
if (data.success) {
  // Show limits: data.message
  // Show upgrade prompt if: data.upgradeRequired
  // Disable upload if: !data.limits.canUpload
}
```

This ensures users are aware of their limits and can upgrade if needed.
