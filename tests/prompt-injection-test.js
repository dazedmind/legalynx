/**
 * Prompt Injection Security Test Script
 * 
 * This script tests various prompt injection attacks against the LegalynX chat system
 * using real documents from sample_docs and prompts from prompt_injections.csv
 * 
 * Usage: node tests/prompt-injection-test.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');
const csv = require('csv-parser');

const prisma = new PrismaClient();

// Configuration
const CONFIG = {
  SERVER_URL: 'http://localhost:3000',
  FASTAPI_URL: 'http://localhost:8000',
  SAMPLE_DOCS_DIR: path.join(__dirname, '..', 'src', 'app', 'backend', 'sample_docs'),
  CSV_FILE: path.join(__dirname, 'SOP 2.csv'),
  TEST_DELAY_MS: 3000, // Delay between tests
  RAG_INIT_WAIT_MS: 15000, // Wait time for RAG system initialization
  MAX_RETRIES: 3 // Maximum retries for failed requests
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Create JWT token for API authentication
function createTestToken(userId) {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign(
    { userId: userId },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

// Create test user for the security test
async function createTestUser() {
  const testId = crypto.randomBytes(4).toString('hex');
  const userId = `security-test-user-${testId}`;
  const email = `security-test-${testId}@example.com`;
  
  // Create user
  const user = await prisma.user.create({
    data: {
      id: userId,
      email: email,
      name: `Security Test User`,
      password: 'test-password-hash',
      email_verified: true
    }
  });

  // Create subscription (PREMIUM for unlimited access)
  const subscription = await prisma.subscription.create({
    data: {
      user_id: userId,
      plan_type: 'PREMIUM',
      token_limit: 100000,
      storage: 10240,
      days_remaining: 30
    }
  });

  return { user, subscription };
}

// Load prompt injections from CSV
async function loadPromptInjections() {
  return new Promise((resolve, reject) => {
    const prompts = [];
    
    if (!fs.existsSync(CONFIG.CSV_FILE)) {
      reject(new Error(`CSV file not found: ${CONFIG.CSV_FILE}`));
      return;
    }
    
    fs.createReadStream(CONFIG.CSV_FILE)
      .pipe(csv())
      .on('data', (row) => {
        prompts.push({
          index: parseInt(row.index),
          prompt: row.prompt
        });
      })
      .on('end', () => {
        log(`📄 Loaded ${prompts.length} prompt injection tests from CSV`, 'blue');
        resolve(prompts);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Get a sample PDF file
function getSamplePDF() {
  try {
    const files = fs.readdirSync(CONFIG.SAMPLE_DOCS_DIR)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .slice(0, 1); // Just take the first PDF
    
    if (files.length === 0) {
      throw new Error('No PDF files found in sample_docs directory');
    }
    
    const selectedFile = files[0];
    log(`📄 Selected test document: ${selectedFile}`, 'blue');
    return selectedFile;
  } catch (error) {
    log(`❌ Error selecting PDF: ${error.message}`, 'red');
    throw error;
  }
}

// Upload document via API
async function uploadDocument(userId, pdfFileName, token) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const pdfPath = path.join(CONFIG.SAMPLE_DOCS_DIR, pdfFileName);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfStats = fs.statSync(pdfPath);
    
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: pdfFileName,
      contentType: 'application/pdf',
      knownLength: pdfStats.size
    });
    
    const response = await fetch(`${CONFIG.SERVER_URL}/backend/api/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${result.error || 'Unknown error'}`);
    }
    
    return result;
    
  } catch (error) {
    log(`❌ Document upload failed: ${error.message}`, 'red');
    throw error;
  }
}

// Create chat session
async function createChatSession(documentId, token) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/backend/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId: documentId,
        title: 'Security Test Session'
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Chat session creation failed: ${result.error || 'Unknown error'}`);
    }
    
    return result;
    
  } catch (error) {
    log(`❌ Chat session creation failed: ${error.message}`, 'red');
    throw error;
  }
}

// Send message to chat session and get response
async function sendChatMessage(sessionId, message, token) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    // Add user message to session
    const userMsgResponse = await fetch(`${CONFIG.SERVER_URL}/backend/api/chat/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: message,
        role: 'USER'
      })
    });
    
    if (!userMsgResponse.ok) {
      const error = await userMsgResponse.json();
      throw new Error(`Failed to add user message: ${error.error || 'Unknown error'}`);
    }
    
    // Query the FastAPI backend for AI response
    const queryResponse = await fetch(`${CONFIG.FASTAPI_URL}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Session-ID': sessionId
      },
      body: JSON.stringify({
        query: message
      })
    });
    
    if (!queryResponse.ok) {
      const error = await queryResponse.json();
      const errorMsg = error.detail || error.message || 'Unknown error';
      throw new Error(`FastAPI query failed (${queryResponse.status}): ${errorMsg}`);
    }
    
    const aiResponse = await queryResponse.json();
    
    // Validate response structure
    if (!aiResponse.response) {
      throw new Error('Invalid response from RAG system - missing response field');
    }
    
    // Add AI response to session
    await fetch(`${CONFIG.SERVER_URL}/backend/api/chat/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: aiResponse.response,
        role: 'ASSISTANT',
        sourceNodes: aiResponse.source_count ? [`${aiResponse.source_count} sources`] : null,
        tokensUsed: aiResponse.tokens_used || null
      })
    });
    
    return aiResponse.response;
    
  } catch (error) {
    throw new Error(`Chat message failed: ${error.message}`);
  }
}

// Main test runner
async function runPromptInjectionTests() {
  log('🚀 Starting Prompt Injection Security Test Suite', 'cyan');
  log('=' .repeat(80), 'cyan');
  
  let user = null;
  let documentId = null;
  let sessionId = null;
  
  try {
    // Load prompt injections
    const prompts = await loadPromptInjections();
    
    // Create test user
    log('\n👤 Creating test user...', 'blue');
    const { user: testUser } = await createTestUser();
    user = testUser;
    const token = createTestToken(user.id);
    log(`✅ Test user created: ${user.email}`, 'green');
    
    // Upload test document
    log('\n📄 Uploading test document...', 'blue');
    const pdfFileName = getSamplePDF();
    const uploadResult = await uploadDocument(user.id, pdfFileName, token);
    
    // Handle different response structures
    if (uploadResult.document && uploadResult.document.id) {
      documentId = uploadResult.document.id;
    } else if (uploadResult.documentId) {
      documentId = uploadResult.documentId;
    } else if (uploadResult.id) {
      documentId = uploadResult.id;
    } else {
      throw new Error('Could not extract document ID from upload response');
    }
    
    log(`✅ Document uploaded successfully`, 'green');
    
    // Wait for document processing and RAG system initialization
    log('⏳ Waiting for document processing and RAG system initialization...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, CONFIG.RAG_INIT_WAIT_MS));
    
    // Create chat session
    log('\n💬 Creating chat session...', 'blue');
    const chatSession = await createChatSession(documentId, token);
    sessionId = chatSession.sessionId;
    log(`✅ Chat session created: ${sessionId}`, 'green');
    
    // Test RAG system readiness
    log('\n🔍 Testing RAG system readiness...', 'blue');
    try {
      const testResponse = await sendChatMessage(sessionId, 'What is this document about?', token);
      log(`✅ RAG system is ready and responding`, 'green');
    } catch (error) {
      log(`❌ RAG system not ready: ${error.message}`, 'red');
      throw error;
    }
    
    // Run prompt injection tests
    log(`\n🧪 Running ${prompts.length} prompt injection tests...`, 'magenta');
    log('=' .repeat(80), 'cyan');
    
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      
      // Print test number
      log(`\n📝 Test ${i + 1} out of ${prompts.length}`, 'cyan');
      
      // Print the actual prompt
      log(`💬 Prompt: ${prompt.prompt}`, 'white');
      
      try {
        // Send prompt to RAG pipeline and get response
        const response = await sendChatMessage(sessionId, prompt.prompt, token);
        
        // Print the full chat response
        log(`🤖 Response: ${response}`, 'green');
        
      } catch (error) {
        log(`❌ Error: ${error.message}`, 'red');
      }
      
      // Add separator between tests
      log('-'.repeat(80), 'white');
      
      // Wait between requests to avoid overwhelming the system
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.TEST_DELAY_MS));
      }
    }
    
    log(`\n✅ All tests completed!`, 'green');
    
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'red');
    if (error.stack) {
      log(`Stack: ${error.stack}`, 'red');
    }
  } finally {
    // Cleanup
    try {
      if (sessionId) {
        await prisma.chatMessage.deleteMany({ where: { session_id: sessionId } });
        await prisma.chatSession.delete({ where: { id: sessionId } });
      }
      if (documentId) {
        await prisma.document.delete({ where: { id: documentId } });
      }
      if (user) {
        await prisma.subscription.deleteMany({ where: { user_id: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        log(`🧹 Cleaned up test user: ${user.email}`, 'yellow');
      }
    } catch (cleanupError) {
      log(`⚠️  Cleanup failed: ${cleanupError.message}`, 'yellow');
    }
    
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Check if required dependencies are available
  try {
    require('csv-parser');
  } catch (e) {
    log('❌ Missing dependency: csv-parser', 'red');
    log('Please install it with: npm install csv-parser', 'yellow');
    process.exit(1);
  }
  
  runPromptInjectionTests().catch(console.error);
}

module.exports = {
  runPromptInjectionTests,
  loadPromptInjections,
  sendChatMessage,
  CONFIG
};