#!/bin/bash

# Document Limits Test Runner
# This script tests document upload limits for different subscription tiers

echo "🚀 Starting Document Upload Limits Test Suite"
echo "=============================================="
echo ""
echo "Testing the following limits:"
echo "• BASIC: 5 documents maximum"
echo "• STANDARD: 20 documents maximum"
echo "• PREMIUM: Unlimited documents"
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
if [ ! -f "tests/document-limits-test.js" ]; then
    echo "❌ Error: Test file not found at tests/document-limits-test.js"
    exit 1
fi

# Run the tests
echo "🧪 Running document limits tests..."
echo ""

npm run test-document-limits

# Check the exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed successfully!"
    echo ""
    echo "📋 Summary:"
    echo "   • Document limits are properly enforced"
    echo "   • BASIC users can upload up to 5 documents"
    echo "   • STANDARD users can upload up to 20 documents"
    echo "   • PREMIUM users have unlimited document uploads"
    echo ""
    echo "🔧 Integration:"
    echo "   • Document upload API now checks limits before allowing uploads"
    echo "   • Frontend can check limits via /backend/api/documents/limits"
    echo "   • Utility functions available in src/lib/document-limits.ts"
else
    echo ""
    echo "❌ Tests failed! Please check the output above for details."
    exit 1
fi
