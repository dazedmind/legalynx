#!/bin/bash

# Document Renaming Speed Test Runner
# This script runs performance tests for document renaming in the RAG pipeline

echo "🚀 Starting Document Renaming Speed Test Suite"
echo "=============================================="
echo ""
echo "This test will:"
echo "• Test different naming options (keep_original, intelligent, client_based, title_based)"
echo "• Upload multiple documents from sample_docs/ folder"
echo "• Measure upload speed, renaming speed, and overall performance"
echo "• Generate a comprehensive performance report"
echo "• Save results to a JSON report file"
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
if [ ! -f "tests/document-renaming-speed-test.js" ]; then
    echo "❌ Error: Test file not found at tests/document-renaming-speed-test.js"
    echo "Please make sure you've created the test file in the tests/ directory"
    exit 1
fi

# Check if sample docs exist
if [ ! -d "src/app/backend/sample_docs" ]; then
    echo "❌ Error: Sample documents directory not found at src/app/backend/sample_docs/"
    exit 1
fi

# Count PDF files in sample_docs
pdf_count=$(find src/app/backend/sample_docs -name "*.pdf" | wc -l)
if [ "$pdf_count" -eq 0 ]; then
    echo "❌ Error: No PDF files found in sample_docs/ directory"
    echo "Please add some PDF files to test with"
    exit 1
fi

echo "📁 Found $pdf_count PDF files in sample_docs/"
echo ""

echo "⚠️  IMPORTANT PREREQUISITES:"
echo "   1. Next.js server must be running on http://localhost:3000"
echo "   2. FastAPI backend must be running on http://localhost:8000"
echo "   3. PostgreSQL database must be accessible"
echo "   4. Environment variables must be properly configured"
echo ""
echo "If any servers are not running, the test will fail."
echo ""
read -p "Continue with the test? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Test cancelled."
    exit 0
fi

echo ""
echo "🧪 Running document renaming speed tests..."
echo ""

# Set test environment variables
export NODE_ENV=test
export TEST_TYPE=speed

# Run the speed test
node tests/document-renaming-speed-test.js

# Check the exit code
exit_code=$?
if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ Speed test completed successfully!"
    echo ""
    echo "📋 What was tested:"
    echo "   • Upload speed for different file sizes"
    echo "   • Renaming speed for different naming options"
    echo "   • Overall processing performance"
    echo "   • Naming option efficiency comparison"
    echo ""
    echo "📊 Performance Analysis:"
    echo "   • Individual file upload timings"
    echo "   • Average speeds per naming option"
    echo "   • Fastest and slowest uploads identified"
    echo "   • Performance recommendations generated"
    echo ""
    echo "📁 Report files saved in tests/ directory"
    echo "Check the output above for detailed performance findings."
    echo ""
    echo "💡 Performance Tips:"
    echo "   • Use the fastest naming option identified for production"
    echo "   • Consider file size optimization if uploads are slow"
    echo "   • Monitor the recommendations for system optimization"
else
    echo ""
    echo "❌ Speed test failed! Please check the output above for details."
    echo ""
    echo "Common issues:"
    echo "   • Servers not running (localhost:3000 or localhost:8000)"
    echo "   • Database connection problems"
    echo "   • Missing dependencies (run: npm install)"
    echo "   • Network connectivity issues"
    echo "   • Insufficient permissions for file operations"
    echo ""
    echo "Debug steps:"
    echo "   1. Verify both servers are running and accessible"
    echo "   2. Check database connectivity"
    echo "   3. Ensure sample PDF files exist in sample_docs/"
    echo "   4. Run: npm install to install dependencies"
    exit 1
fi