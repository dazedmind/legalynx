@echo off
REM Document Limits Test Runner for Windows
REM This script tests document upload limits for different subscription tiers

echo 🚀 Starting Document Upload Limits Test Suite
echo ==============================================
echo.
echo Testing the following limits:
echo • BASIC: 5 documents maximum
echo • STANDARD: 20 documents maximum
echo • PREMIUM: Unlimited documents
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if the test file exists
if not exist "tests\document-limits-test.js" (
    echo ❌ Error: Test file not found at tests\document-limits-test.js
    pause
    exit /b 1
)

REM Run the tests
echo 🧪 Running document limits tests...
echo.

npm run test-document-limits

REM Check the exit code
if %errorlevel% equ 0 (
    echo.
    echo ✅ All tests passed successfully!
    echo.
    echo 📋 Summary:
    echo    • Document limits are properly enforced
    echo    • BASIC users can upload up to 5 documents
    echo    • STANDARD users can upload up to 20 documents
    echo    • PREMIUM users have unlimited document uploads
    echo.
    echo 🔧 Integration:
    echo    • Document upload API now checks limits before allowing uploads
    echo    • Frontend can check limits via /backend/api/documents/limits
    echo    • Utility functions available in src/lib/document-limits.ts
) else (
    echo.
    echo ❌ Tests failed! Please check the output above for details.
    pause
    exit /b 1
)

echo.
echo Press any key to continue...
pause >nul
