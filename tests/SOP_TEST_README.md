# SOP Q&A Test Suite

Automated testing script for validating document question-answering capabilities based on the SOP 1.csv dataset.

## Overview

This test suite reads questions from `SOP 1.csv`, creates chat sessions for each document, asks all 10 questions per file, and measures response times and accuracy.

## Features

- ✅ Automated Q&A testing for multiple documents
- ✅ **Automatic document upload** from `sample_files` directory
- ✅ Response time measurement for each question
- ✅ Colorized terminal output for better readability
- ✅ Full answer display (no truncation)
- ✅ JSON output of all results
- ✅ Summary statistics (avg/min/max response times)

## Prerequisites

1. **Node.js** installed
2. **Dependencies** - Already included in package.json:
   - `xlsx` - for reading Excel files
   - `form-data` - for file uploads

3. **Authentication token** (JWT) from your application

4. **Sample files** - Located in `src/app/backend/sample_files/`

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including `xlsx` and `form-data`.

### 2. Get Your Authentication Token

You need a valid JWT token to authenticate with the API. You can get this by:

**Option A: Login via Browser DevTools**
1. Open your app in browser and login
2. Open DevTools (F12) → Network tab
3. Look for any API request
4. Copy the `Authorization` header value (it starts with "Bearer ...")

**Option B: Login via API**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### 3. Set Environment Variables

```bash
# Required: Your JWT token
export AUTH_TOKEN="your-jwt-token-here"

# Optional: API base URL (defaults to http://localhost:3000)
export API_BASE_URL="http://localhost:3000"
```

### 4. Documents Auto-Upload

**No manual upload needed!** The script will automatically:
1. Search for documents in your account
2. If not found, upload from `src/app/backend/sample_files/`
3. Match files by name from `SOP 1.csv`

## Running the Tests

```bash
# Option 1: Using npm script (recommended)
npm run test-rag-pipeline

# Option 2: Direct execution
node tests/rag-pipeline-test.js
```

## Output Format

### Console Output

The script provides detailed, colorized console output:

```
════════════════════════════════════════════════════════════════
           SOP Q&A TEST - DOCUMENT VALIDATION SUITE
════════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 File [1/15]: A.M. No. RTJ-23-039 DECISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Searching for document...
✓ Found document: A.M. No. RTJ-23-039 DECISION.pdf (ID: doc_123)

💬 Creating chat session...
✓ Session created: session_456

❓ Question 1/10:
   What is the A.M. number of the decision?

💡 Answer:
   The A.M. number of the decision is A.M. No. RTJ-23-039.

⏱️  Response time: 1.23s

...

✓ Completed A.M. No. RTJ-23-039 DECISION
  Average response time: 1.45s
```

### Summary Statistics

```
════════════════════════════════════════════════════════════════
                          TEST SUMMARY
════════════════════════════════════════════════════════════════

Files processed: 15/15
Questions answered: 150/150
Average response time: 1.52s
Min response time: 0.89s
Max response time: 3.21s

✓ Results saved to: ./sop-test-results.json
```

### JSON Output

Results are saved to `sop-test-results.json`:

```json
[
  {
    "file": "A.M. No. RTJ-23-039 DECISION",
    "documentId": "doc_123",
    "sessionId": "session_456",
    "status": "SUCCESS",
    "questions": [
      {
        "index": 1,
        "question": "What is the A.M. number of the decision?",
        "answer": "The A.M. number of the decision is A.M. No. RTJ-23-039.",
        "responseTime": 1234,
        "status": "SUCCESS"
      }
    ]
  }
]
```

## Understanding the Results

### Status Codes

- **SUCCESS**: Question answered successfully
- **ERROR**: Error occurred during question processing
- **NOT_FOUND**: Document not found in your account

### Response Times

Response times are measured in milliseconds and include:
- API request time
- Document retrieval time
- AI processing time
- Network latency

## Troubleshooting

### Error: AUTH_TOKEN not set
```bash
❌ ERROR: AUTH_TOKEN environment variable not set
```
**Solution**: Set the AUTH_TOKEN environment variable with your JWT token.

### Error: Document not found
```bash
❌ Document not found: filename.pdf
```
**Solution**: Upload the document to your account, or check that the filename matches exactly.

### Error: Failed to create chat session
```bash
❌ Failed to create chat session: Unauthorized
```
**Solution**: Your token may have expired. Get a new token and update AUTH_TOKEN.

## Customization

### Modify API Endpoint

Edit the `API_BASE_URL` in the script or set it via environment variable:

```bash
export API_BASE_URL="https://your-production-api.com"
```

### Change Question Dataset

Replace `SOP 1.csv` with your own Excel file. Format:
```
File          | Index | Questions
------------- | ----- | ---------
document.pdf  | 1     | What is...?
document.pdf  | 2     | Who is...?
```

### Adjust Output Format

Modify the console.log statements in the script to customize output formatting.

## Test Data Structure

The `SOP 1.csv` file should have the following columns:

| Column    | Description                        |
|-----------|------------------------------------|
| File      | Document filename                  |
| Index     | Question number (1-10)            |
| Questions | The question text                  |

## Performance Benchmarks

Typical response times:
- **Fast**: < 1s
- **Average**: 1-2s
- **Slow**: > 3s

Factors affecting speed:
- Document size and complexity
- Number of pages
- Question complexity
- Server load
- Network latency

## Next Steps

After running tests, you can:
1. Review `sop-test-results.json` for detailed results
2. Identify slow-performing documents
3. Check answer accuracy manually
4. Generate reports or dashboards from the JSON output

## Support

For issues or questions about this test suite, refer to the main project documentation.
