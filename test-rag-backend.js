// Test script to verify FastAPI backend is working
const testRAGBackend = async () => {
  const baseUrl = 'http://localhost:8000';
  
  console.log('🧪 Testing RAG Backend...');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
    
    // Test check-document endpoint
    console.log('2. Testing check-document endpoint...');
    const checkResponse = await fetch(`${baseUrl}/check-document/test-doc-123`);
    if (checkResponse.ok) {
      const checkData = await checkResponse.json();
      console.log('✅ Check document passed:', checkData);
    } else {
      console.log('❌ Check document failed:', checkResponse.status);
    }
    
    // Test root endpoint
    console.log('3. Testing root endpoint...');
    const rootResponse = await fetch(`${baseUrl}/`);
    if (rootResponse.ok) {
      const rootData = await rootResponse.json();
      console.log('✅ Root endpoint passed:', rootData);
    } else {
      console.log('❌ Root endpoint failed:', rootResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('💡 Make sure the FastAPI backend is running with: npm run fastapi');
  }
};

// Run the test
testRAGBackend(); 