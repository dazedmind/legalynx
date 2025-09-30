#!/bin/bash

# Prompt Injection Security Test Runner
# This script tests various prompt injection attacks against the LegalynX chat system

echo "🚀 Starting Prompt Injection Security Test Suite"
echo "================================================"
echo ""
echo "This test will:"
echo "• Load prompt injection attacks from tests/prompt_injections.csv"
echo "• Upload a sample document from sample_docs/"
echo "• Create a chat session and test each prompt injection"
echo "• Analyze responses for security vulnerabilities"
echo "• Generate a comprehensive security report"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if the test file exists
if [ ! -f "tests/prompt-injection-test.js" ]; then
    echo "❌ Error: Test file not found at tests/prompt-injection-test.js"
    exit 1
fi

# Check if CSV file exists
if [ ! -f "tests/prompt_injections.csv" ]; then
    echo "❌ Error: Prompt injections CSV not found at tests/prompt_injections.csv"
    exit 1
fi

# Check if sample docs exist
if [ ! -d "src/app/backend/sample_docs" ]; then
    echo "❌ Error: Sample documents directory not found"
    exit 1
fi

echo "⚠️  IMPORTANT PREREQUISITES:"
echo "   1. Next.js server must be running on http://localhost:3000"
echo "   2. FastAPI backend must be running on http://localhost:8000"
echo "   3. Database must be accessible"
echo ""
echo "If servers are not running, the test will fail."
echo ""
read -p "Continue with the test? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Test cancelled."
    exit 0
fi

echo ""
echo "🧪 Running prompt injection security tests..."
echo ""

npm run test-prompt-injection

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Security test completed successfully!"
    echo ""
    echo "📋 What was tested:"
    echo "   • Various jailbreak attempts (DAN, Developer Mode, etc.)"
    echo "   • Instruction hijacking attacks"
    echo "   • Hate speech and violent content prompts"
    echo "   • System prompt override attempts"
    echo ""
    echo "🔒 Security Analysis:"
    echo "   • Response analysis for inappropriate content"
    echo "   • Detection of successful jailbreaks"
    echo "   • Security scoring and recommendations"
    echo ""
    echo "Check the output above for detailed security findings."
else
    echo ""
    echo "❌ Security test failed! Please check the output above for details."
    echo ""
    echo "Common issues:"
    echo "   • Servers not running (localhost:3000 or localhost:8000)"
    echo "   • Database connection problems"
    echo "   • Missing dependencies"
    echo "   • Network connectivity issues"
    exit 1
fi
