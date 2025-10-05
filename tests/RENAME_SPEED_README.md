# Document Renaming Speed Test

This test suite measures the performance of document renaming during the RAG pipeline upload process. It provides comprehensive metrics on upload speed, renaming efficiency, and overall system performance.

## Features

- **Upload Speed Measurement**: Tracks time taken for file upload to the server
- **Renaming Performance**: Measures the speed of different naming options
- **Overall Process Timing**: End-to-end performance metrics
- **Comparative Analysis**: Performance comparison across naming options
- **Detailed Reporting**: JSON and console reports with recommendations

## Naming Options Tested

1. **keep_original** - Keeps the original filename
2. **add_timestamp** - Names based on document title
3. **add_client_name** - Names based on client information

## Prerequisites

Before running the tests, ensure:

1. **Next.js Server**: Running on `http://localhost:3000`
2. **FastAPI RAG Backend**: Running on `http://localhost:8000` 
3. **Database**: PostgreSQL accessible with correct `DATABASE_URL`
4. **Environment Variables**: Properly configured (JWT_SECRET, etc.)
5. **Sample Documents**: PDF files available in `src/app/backend/sample_docs/`
6. **Dependencies**: All npm packages installed (`npm install`)

## Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Ensure Sample Documents**:
   ```bash
   # Make sure you have PDF files in the sample_docs directory
   ls src/app/backend/sample_docs/*.pdf
   ```

3. **Set Environment Variables**:
   ```bash
   # In your .env file
   DATABASE_URL="postgresql://..."
   JWT_SECRET="your-secret-key"
   ```

## How to Run Tests

### Option 1: Using npm script (Recommended)
```bash
npm run test-speed
```

### Option 2: Using shell script
**Unix/Linux/macOS:**
```bash
chmod +x run-document-renaming-speed-test.sh
./run-document-renaming-speed-test.sh
```

**Windows (Git Bash/WSL):**
```bash
bash run-document-renaming-speed-test.sh
```

### Option 3: Direct execution
```bash
node tests/document-renaming-speed-test.js
```

## Test Process

1. **Setup Phase**
   - Verifies sample PDF files are available
   - Creates temporary test user with PREMIUM subscription
   - Validates server connectivity

2. **Performance Testing Phase**
   - Tests each naming option with multiple documents
   - Measures upload speed, renaming speed, and total time
   - Records original and renamed filenames
   - Applies configurable delays between tests

3. **Analysis Phase**
   - Calculates average speeds per naming option
   - Identifies fastest and slowest uploads
   - Generates performance recommendations
   - Creates detailed performance report

4. **Cleanup Phase**
   - Removes test user and associated data
   - Saves report to JSON file
   - Displays summary statistics

## Configuration

You can modify test parameters in the script:

```javascript
const CONFIG = {
  SERVER_URL: 'http://localhost:3000',
  FASTAPI_URL: 'http://localhost:8000',
  TEST_DELAY_MS: 1000,           // Delay between uploads
  TEST_BATCH_SIZE: 5,            // Documents per naming option
  NAMING_OPTIONS: ['keep_original','add_timestamp', 'add_client_name']
};
```

## Sample Output

```
🚀 Starting Document Renaming Speed Test Suite
==============================================================

📁 Found 15 sample PDF files

👤 Created test user: speed-test-abc123@example.com

📝 Testing naming option: KEEP_ORIGINAL
--------------------------------------------------
📤 Testing upload: document1.pdf (245.3KB) with keep_original
✅ Upload completed in 2.34s
   📋 Original: document1.pdf
   📝 Renamed:  document1.pdf
   ⏱️  Upload: 1.12s | Rename: 0.03s | Total: 2.34s

📝 Testing naming option: INTELLIGENT
--------------------------------------------------
📤 Testing upload: document2.pdf (187.2KB) with intelligent
✅ Upload completed in 4.67s
   📋 Original: document2.pdf
   📝 Renamed:  Contract_Analysis_Report_2024.pdf
   ⏱️  Upload: 1.45s | Rename: 2.89s | Total: 4.67s

📊 DOCUMENT RENAMING SPEED TEST REPORT
==============================================================

📈 PERFORMANCE SUMMARY:
   Total tests conducted: 20
   Average upload speed: 1.23s
   Average rename speed: 1.45s
   Average overall speed: 3.12s
   Fastest upload: 1.89s
   Slowest upload: 5.67s

🏷️  NAMING OPTION PERFORMANCE:
   keep_original       : 2.10s avg (5 tests)
   intelligent         : 4.25s avg (5 tests)
   client_based        : 2.78s avg (5 tests)
   title_based         : 2.34s avg (5 tests)

💡 RECOMMENDATIONS:
   • Fastest naming option: keep_original (2.10s average)
   • [Inference] Intelligent naming adds 2.15s average overhead
   • [Inference] Consider caching for frequently renamed patterns

📋 DETAILED RESULTS:
------------------------------------------------------------------------------------------------------------------------
Original Filename        Renamed Filename         Option         Size(KB)  Upload(s) Rename(s) Total(s)  Status
------------------------------------------------------------------------------------------------------------------------
document1.pdf            document1.pdf            keep_original  245.3     1.12      0.03      2.34      ✅
contract.pdf             Legal_Contract_Final.pdf intelligent    187.2     1.45      2.89      4.67      ✅
report.pdf               Client_A_Report.pdf      client_based   156.8     0.98      1.23      2.78      ✅
...

✅ All tests completed successfully!

📋 TEST SUMMARY:
   • Tested 20 document uploads
   • Average processing time: 3.12s
   • Fastest naming option: keep_original
   • Used 15 sample PDF files from sample_docs/
```