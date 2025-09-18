@echo off
REM Document Renaming Speed Test Runner for Windows
REM This batch file runs performance tests for document renaming in the RAG pipeline

echo.
echo 🚀 Starting Document Renaming Speed Test Suite
echo ==============================================
echo.
echo This test will:
echo • Test different naming options (keep_original, intelligent, client_based, title_based)
echo • Upload multiple documents from sample_docs\ folder
echo • Measure upload speed, renaming speed, and overall performance
echo • Generate a comprehensive performance report
echo • Save results to a JSON report file
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Check if the test file exists
if not exist "tests\document-renaming-speed-test.js" (
    echo ❌ Error: Test file not found at tests\document-renaming-speed-test.js
    echo Please make sure you've created the test file in the tests\ directory
    pause
    exit /b 1
)

REM Check if sample docs exist
if not exist "src\app\backend\sample_docs" (
    echo ❌ Error: Sample documents directory not found at src\app\backend\sample_docs\
    pause
    exit /b 1
)

REM Count PDF files in sample_docs
set pdf_count=0
for %%f in ("src\app\backend\sample_docs\*.pdf") do (
    set /a pdf_count+=1
)

if %pdf_count%==0 (
    echo ❌ Error: No PDF files found in sample_docs\ directory
    echo Please add some PDF files to test with
    pause
    exit /b 1
)

echo 📁 Found %pdf_count% PDF files in sample_docs\
echo.

echo ⚠️  IMPORTANT PREREQUISITES:
echo    1. Next.js server must be running on http://localhost:3000
echo    2. FastAPI backend must be running on http://localhost:8000
echo    3. PostgreSQL database must be accessible
echo    4. Environment variables must be properly configured
echo.
echo If any servers are not running, the test will fail.
echo.

set /p continue="Continue with the test? (y/n): "
if /i not "%continue%"=="y" (
    echo Test cancelled.
    pause
    exit /b 0
)

echo.
echo 🧪 Running document renaming speed tests...
echo.

REM Set test environment variables
set NODE_ENV=test
set TEST_TYPE=speed

REM Run the speed test
node tests\document-renaming-speed-test.js

REM Check the exit code
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Speed test completed successfully!
    echo.
    echo 📋 What was tested:
    echo    • Upload speed for different file sizes
    echo    • Renaming speed for different naming options
    echo    • Overall processing performance
    echo    • Naming option efficiency comparison
    echo.
    echo 📊 Performance Analysis:
    echo    • Individual file upload timings
    echo    • Average speeds per naming option
    echo    • Fastest and slowest uploads identified
    echo    • Performance recommendations generated
    echo.
    echo 📁 Report files saved in tests\ directory
    echo Check the output above for detailed performance findings.
    echo.
    echo 💡 Performance Tips:
    echo    • Use the fastest naming option identified for production
    echo    • Consider file size optimization if uploads are slow
    echo    • Monitor the recommendations for system optimization
) else (
    echo.
    echo ❌ Speed test failed! Please check the output above for details.
    echo.
    echo Common issues:
    echo    • Servers not running (localhost:3000 or localhost:8000)
    echo    • Database connection problems
    echo    • Missing dependencies (run: npm install)
    echo    • Network connectivity issues
    echo    • Insufficient permissions for file operations
    echo.
    echo Debug steps:
    echo    1. Verify both servers are running and accessible
    echo    2. Check database connectivity
    echo    3. Ensure sample PDF files exist in sample_docs\
    echo    4. Run: npm install to install dependencies
)

echo.
pause