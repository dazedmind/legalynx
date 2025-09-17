@echo off
REM Prompt Injection Security Test Runner for Windows
REM This script tests various prompt injection attacks against the LegalynX chat system

echo 🚀 Starting Prompt Injection Security Test Suite
echo ================================================
echo.
echo This test will:
echo • Load prompt injection attacks from tests/prompt_injections.csv
echo • Upload a sample document from sample_docs/
echo • Create a chat session and test each prompt injection
echo • Analyze responses for security vulnerabilities
echo • Generate a comprehensive security report
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
if not exist "tests\prompt-injection-test.js" (
    echo ❌ Error: Test file not found at tests\prompt-injection-test.js
    pause
    exit /b 1
)

REM Check if CSV file exists
if not exist "tests\prompt_injections.csv" (
    echo ❌ Error: Prompt injections CSV not found at tests\prompt_injections.csv
    pause
    exit /b 1
)

REM Check if sample docs exist
if not exist "src\app\backend\sample_docs" (
    echo ❌ Error: Sample documents directory not found
    pause
    exit /b 1
)

echo ⚠️  IMPORTANT PREREQUISITES:
echo    1. Next.js server must be running on http://localhost:3000
echo    2. FastAPI backend must be running on http://localhost:8000
echo    3. Database must be accessible
echo.
echo If servers are not running, the test will fail.
echo.
set /p continue="Continue with the test? (y/n): "
if /i not "%continue%"=="y" (
    echo Test cancelled.
    pause
    exit /b 0
)

echo.
echo 🧪 Running prompt injection security tests...
echo.

npm run test-prompt-injection

REM Check the exit code
if %errorlevel% equ 0 (
    echo.
    echo ✅ Security test completed successfully!
    echo.
    echo 📋 What was tested:
    echo    • Various jailbreak attempts (DAN, Developer Mode, etc.)
    echo    • Instruction hijacking attacks
    echo    • Hate speech and violent content prompts
    echo    • System prompt override attempts
    echo.
    echo 🔒 Security Analysis:
    echo    • Response analysis for inappropriate content
    echo    • Detection of successful jailbreaks
    echo    • Security scoring and recommendations
    echo.
    echo Check the output above for detailed security findings.
) else (
    echo.
    echo ❌ Security test failed! Please check the output above for details.
    echo.
    echo Common issues:
    echo    • Servers not running (localhost:3000 or localhost:8000)
    echo    • Database connection problems
    echo    • Missing dependencies
    echo    • Network connectivity issues
)

echo.
echo Press any key to continue...
pause >nul
