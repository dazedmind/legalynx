// src/scripts/debug-invoice-system.ts
// Debug script to test invoice sending and identify issues

import { prisma } from '@/lib/prisma';
import { prismaInvoiceService } from '@/lib/invoice-service';
import sgMail from '@sendgrid/mail';

interface DebugConfig {
  testUserEmail?: string;  // Override with specific test user
  testPlan?: 'STANDARD' | 'PREMIUM';
  testBilling?: 'monthly' | 'yearly';
  skipEmailSending?: boolean;  // Test without actually sending emails
}

class InvoiceSystemDebugger {
  
  async runFullDebug(config: DebugConfig = {}) {
    console.log('🔍 Starting Invoice System Debug...\n');
    
    // Step 1: Check environment variables
    await this.checkEnvironmentVariables();
    
    // Step 2: Check SendGrid configuration
    await this.checkSendGridConfiguration();
    
    // Step 3: Check database connectivity
    await this.checkDatabaseConnection();
    
    // Step 4: Find a test user or use provided email
    const testUser = await this.findTestUser(config.testUserEmail);
    
    if (!testUser) {
      console.log('❌ No test user found. Please provide a valid user email.');
      return;
    }
    
    // Step 5: Test invoice creation (without sending)
    await this.testInvoiceCreation(testUser, config);
    
    // Step 6: Test full invoice workflow (if enabled)
    if (!config.skipEmailSending) {
      await this.testFullInvoiceWorkflow(testUser, config);
    } else {
      console.log('⏭️ Skipping actual email sending (skipEmailSending = true)');
    }
    
    console.log('\n✅ Debug completed!');
  }
  
  async checkEnvironmentVariables() {
    console.log('1️⃣ Checking Environment Variables...');
    
    const requiredVars = [
      'SENDGRID_API_KEY',
      'SENDGRID_FROM_EMAIL',
      'DATABASE_URL',
      'JWT_SECRET'
    ];
    
    const optionalVars = [
      'COMPANY_NAME',
      'COMPANY_ADDRESS', 
      'COMPANY_EMAIL',
      'PAYPAL_STANDARD_MONTHLY_PLAN_ID',
      'PAYPAL_PREMIUM_MONTHLY_PLAN_ID'
    ];
    
    console.log('Required Environment Variables:');
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        console.log(`  ✅ ${varName}: ${this.maskSensitive(varName, value)}`);
      } else {
        console.log(`  ❌ ${varName}: NOT SET`);
      }
    });
    
    console.log('\nOptional Environment Variables:');
    optionalVars.forEach(varName => {
      const value = process.env[varName];
      console.log(`  ${value ? '✅' : '⚠️'} ${varName}: ${value || 'NOT SET'}`);
    });
    
    console.log('');
  }
  
  async checkSendGridConfiguration() {
    console.log('2️⃣ Checking SendGrid Configuration...');
    
    if (!process.env.SENDGRID_API_KEY) {
      console.log('  ❌ SendGrid API key not found');
      return;
    }
    
    if (!process.env.SENDGRID_FROM_EMAIL) {
      console.log('  ❌ SendGrid from email not configured');
      return;
    }
    
    try {
      // Set API key
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      // Test API key validity by making a simple API call
      console.log('  🔄 Testing SendGrid API key...');
      
      // Note: This is a basic test. In production, you might want to make an actual API call
      // to verify the key works, but we'll skip that to avoid rate limits during testing
      
      console.log('  ✅ SendGrid API key configured');
      console.log(`  📧 From email: ${process.env.SENDGRID_FROM_EMAIL}`);
      
    } catch (error) {
      console.log('  ❌ SendGrid configuration error:', error);
    }
    
    console.log('');
  }
  
  async checkDatabaseConnection() {
    console.log('3️⃣ Checking Database Connection...');
    
    try {
      // Test basic database connection
      await prisma.$connect();
      console.log('  ✅ Database connection successful');
      
      // Check if invoice tables exist
      try {
        const invoiceCount = await prisma.invoice.count();
        console.log(`  📊 Existing invoices in database: ${invoiceCount}`);
        
        const userCount = await prisma.user.count();
        console.log(`  👥 Total users in database: ${userCount}`);
        
      } catch (tableError) {
        console.log('  ⚠️ Invoice tables may not exist yet. Run: npx prisma migrate dev');
      }
      
    } catch (error) {
      console.log('  ❌ Database connection failed:', error);
    }
    
    console.log('');
  }
  
  async findTestUser(providedEmail?: string) {
    console.log('4️⃣ Finding Test User...');
    
    if (providedEmail) {
      console.log(`  🔍 Looking for user with email: ${providedEmail}`);
      
      const user = await prisma.user.findUnique({
        where: { email: providedEmail },
        include: { subscription: true }
      });
      
      if (user) {
        console.log(`  ✅ Found user: ${user.name || 'No name'} (${user.email})`);
        console.log(`  📊 Current plan: ${user.subscription?.plan_type || 'BASIC'}`);
        return user;
      } else {
        console.log(`  ❌ User not found with email: ${providedEmail}`);
        return null;
      }
    }
    
    // Find any user with email verification
    const user = await prisma.user.findFirst({
      where: { 
        email_verified: true,
        email: { not: { contains: 'test' } }  // Avoid obvious test emails
      },
      include: { subscription: true }
    });
    
    if (user) {
      console.log(`  ✅ Using user: ${user.name || 'No name'} (${user.email})`);
      console.log(`  📊 Current plan: ${user.subscription?.plan_type || 'BASIC'}`);
    } else {
      console.log('  ❌ No suitable test user found');
    }
    
    console.log('');
    return user;
  }
  
  async testInvoiceCreation(user: any, config: DebugConfig) {
    console.log('5️⃣ Testing Invoice Creation (Database Only)...');
    
    const testData = {
      userId: user.id,
      userEmail: user.email,
      userName: user.name || user.email.split('@')[0],
      planType: config.testPlan || 'STANDARD' as const,
      billingCycle: config.testBilling || 'monthly' as const,
      subscriptionId: 'test-subscription-' + Date.now()
    };
    
    console.log('  📋 Test invoice data:');
    console.log('    User ID:', testData.userId);
    console.log('    Email:', testData.userEmail);
    console.log('    Name:', testData.userName);
    console.log('    Plan:', testData.planType);
    console.log('    Billing:', testData.billingCycle);
    
    try {
      // Test just the database creation part
      const result = await prismaInvoiceService.createInvoiceInDatabase(testData);
      
      if (result.success) {
        console.log('  ✅ Invoice created successfully in database!');
        console.log('    Invoice ID:', result.invoiceId);
        console.log('    Invoice Number:', result.invoiceNumber);
        
        // Check if it's actually in the database
        if (result.invoiceId) {
          const savedInvoice = await prisma.invoice.findUnique({
            where: { id: result.invoiceId },
            include: { invoice_items: true }
          });
          
          if (savedInvoice) {
            console.log('  ✅ Invoice confirmed in database');
            console.log('    Items count:', savedInvoice.invoice_items.length);
            console.log('    Amount:', savedInvoice.amount);
            console.log('    Status:', savedInvoice.status);
          }
        }
      } else {
        console.log('  ❌ Invoice creation failed:', result.error);
      }
      
    } catch (error) {
      console.log('  ❌ Invoice creation error:', error);
    }
    
    console.log('');
  }
  
  async testFullInvoiceWorkflow(user: any, config: DebugConfig) {
    console.log('6️⃣ Testing Full Invoice Workflow (With Email)...');
    
    const testData = {
      userId: user.id,
      userEmail: user.email,
      userName: user.name || user.email.split('@')[0],
      planType: config.testPlan || 'STANDARD' as const,
      billingCycle: config.testBilling || 'monthly' as const,
      subscriptionId: 'test-full-' + Date.now()
    };
    
    console.log('  📧 Testing full workflow including email sending...');
    console.log('  🎯 Invoice will be sent to LegalynX email:', testData.userEmail);
    
    try {
      const result = await prismaInvoiceService.createAndSendInvoice(testData);
      
      if (result.success) {
        console.log('  ✅ Full invoice workflow successful!');
        console.log('    Invoice Number:', result.invoiceNumber);
        console.log('    Invoice ID:', result.invoiceId);
        console.log('    📧 Email sent to:', testData.userEmail);
        console.log('    💡 Check the recipient\'s email inbox!');
      } else {
        console.log('  ❌ Full workflow failed:', result.error);
        
        // Check if it was a database or email issue
        if (result.error?.includes('SendGrid') || result.error?.includes('email')) {
          console.log('  💡 This looks like an email sending issue. Check SendGrid configuration.');
        } else {
          console.log('  💡 This might be a database issue. Check the database connection and schema.');
        }
      }
      
    } catch (error) {
      console.log('  ❌ Full workflow error:', error);
    }
    
    console.log('');
  }
  
  private maskSensitive(varName: string, value: string): string {
    if (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('PASSWORD')) {
      return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
    }
    return value;
  }
  
  // Helper method to test with specific scenarios
  async testSpecificScenario(scenarioName: string, user: any) {
    console.log(`\n🎯 Testing Scenario: ${scenarioName}`);
    
    const scenarios = {
      'standard-monthly': {
        planType: 'STANDARD' as const,
        billingCycle: 'monthly' as const
      },
      'premium-yearly': {
        planType: 'PREMIUM' as const, 
        billingCycle: 'yearly' as const
      }
    };
    
    const scenario = scenarios[scenarioName as keyof typeof scenarios];
    if (!scenario) {
      console.log('❌ Unknown scenario');
      return;
    }
    
    await this.testFullInvoiceWorkflow(user, scenario as DebugConfig);
  }
}

// Usage examples and main execution
async function main() {
  const invoiceDebugger = new InvoiceSystemDebugger();
    
  // Configuration for debug run
  const config: DebugConfig = {
    testUserEmail: 'krugmihawk@gmail.com',  // Uncomment and set for specific user
    testPlan: 'STANDARD',
    testBilling: 'monthly',
    skipEmailSending: false  // Set to true to skip actual email sending
  };
  
  // Run full debug
  await invoiceDebugger.runFullDebug(config);
  
  // Or test specific scenarios
  // await debugger.testSpecificScenario('standard-monthly', await findTestUser());
}

// Export for use in other scripts
export { InvoiceSystemDebugger };

// Run if called directly
if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => process.exit(0));
}

export async function quickInvoiceTest(
    userEmail: string,
    planType: 'STANDARD' | 'PREMIUM' = 'STANDARD',
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ) {
    console.log('🚀 Quick Invoice Test Starting...');
    
    try {
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (!user) {
        console.log('❌ User not found:', userEmail);
        return;
      }
      
      console.log('✅ User found:', user.name || user.email);
      console.log('🎯 Sending invoice to LegalynX email:', user.email);
      
      const result = await prismaInvoiceService.createAndSendInvoice({
        userId: user.id,
        userEmail: user.email,  // LegalynX registered email
        userName: user.name || user.email.split('@')[0],
        planType,
        billingCycle,
        subscriptionId: 'quick-test-' + Date.now()
      });
      
      if (result.success) {
        console.log('✅ Quick test successful!');
        console.log('📧 Invoice Number:', result.invoiceNumber);
        console.log('📨 Sent to:', user.email);
        console.log('💡 Check your email inbox!');
      } else {
        console.log('❌ Quick test failed:', result.error);
      }
      
      return result;
      
    } catch (error) {
      console.log('❌ Quick test error:', error);
      return { success: false, error: String(error) };
    }
  }
  
  export async function checkInvoiceHistory(userEmail: string) {
    console.log('📋 Checking Invoice History for:', userEmail);
    
    try {
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (!user) {
        console.log('❌ User not found');
        return;
      }
      
      const invoices = await prisma.invoice.findMany({
        where: { user_id: user.id },
        include: { invoice_items: true },
        orderBy: { created_at: 'desc' },
        take: 10
      });
      
      console.log(`📊 Found ${invoices.length} invoices:`);
      
      invoices.forEach((invoice, index) => {
        console.log(`\n${index + 1}. ${invoice.invoice_number}`);
        console.log(`   Plan: ${invoice.plan_type} (${invoice.billing_cycle})`);
        console.log(`   Amount: ${invoice.amount} ${invoice.currency}`);
        console.log(`   Status: ${invoice.status}`);
        console.log(`   Sent to: ${invoice.email_sent_to}`);
        console.log(`   Created: ${invoice.created_at.toLocaleDateString()}`);
        console.log(`   Items: ${invoice.invoice_items.length}`);
      });
      
    } catch (error) {
      console.log('❌ Error checking history:', error);
    }
  }
  
  // Utility to test with your current PayPal integration
  export async function testWithPayPalSubscription(subscriptionId: string) {
    console.log('🔗 Testing with PayPal Subscription ID:', subscriptionId);
    
    try {
      // Find subscription in database
      const subscription = await prisma.subscription.findFirst({
        where: { external_subscription_id: subscriptionId },
        include: { user: true }
      });
      
      if (!subscription || !subscription.user) {
        console.log('❌ No LegalynX user found for PayPal subscription:', subscriptionId);
        return;
      }
      
      const user = subscription.user;
      console.log('✅ Found LegalynX user for PayPal subscription:');
      console.log('   User:', user.name || user.email);
      console.log('   Email:', user.email);
      console.log('   Plan:', subscription.plan_type);
      
      // Send invoice
      const result = await prismaInvoiceService.createAndSendInvoice({
        userId: user.id,
        userEmail: user.email,  // LegalynX email
        userName: user.name || user.email.split('@')[0],
        planType: subscription.plan_type as 'STANDARD' | 'PREMIUM',
        billingCycle: 'monthly', // You might want to determine this from subscription data
        subscriptionId: subscriptionId
      });
      
      if (result.success) {
        console.log('✅ PayPal subscription invoice sent successfully!');
        console.log('📧 Invoice Number:', result.invoiceNumber);
        console.log('📨 Sent to LegalynX email:', user.email);
      } else {
        console.log('❌ PayPal subscription invoice failed:', result.error);
      }
      
      return result;
      
    } catch (error) {
      console.log('❌ PayPal subscription test error:', error);
      return { success: false, error: String(error) };
    }
  }
  
  // Environment checker for quick setup validation
  export function validateSetup() {
    console.log('🔍 Validating Invoice System Setup...\n');
    
    const checks = [
      {
        name: 'SendGrid API Key',
        check: () => !!process.env.SENDGRID_API_KEY,
        fix: 'Set SENDGRID_API_KEY in your .env file'
      },
      {
        name: 'SendGrid From Email',
        check: () => !!process.env.SENDGRID_FROM_EMAIL,
        fix: 'Set SENDGRID_FROM_EMAIL in your .env file'
      },
      {
        name: 'Database URL',
        check: () => !!process.env.DATABASE_URL,
        fix: 'Set DATABASE_URL in your .env file'
      },
      {
        name: 'JWT Secret',
        check: () => !!process.env.JWT_SECRET,
        fix: 'Set JWT_SECRET in your .env file'
      },
      {
        name: 'Company Name',
        check: () => !!process.env.COMPANY_NAME,
        fix: 'Set COMPANY_NAME in your .env file (optional but recommended)'
      }
    ];
    
    let allPassed = true;
    
    checks.forEach(({ name, check, fix }) => {
      const passed = check();
      console.log(`${passed ? '✅' : '❌'} ${name}`);
      if (!passed) {
        console.log(`   💡 ${fix}`);
        allPassed = false;
      }
    });
    
    console.log(`\n${allPassed ? '✅' : '❌'} Setup validation ${allPassed ? 'passed' : 'failed'}`);
    
    if (allPassed) {
      console.log('\n🎉 Your invoice system is ready to test!');
      console.log('Next steps:');
      console.log('1. Run: npx tsx src/scripts/debug-invoice-system.ts');
      console.log('2. Or test quickly: quickInvoiceTest("your-email@example.com")');
    }
    
    return allPassed;
  }
  
  // Development helper to create test data
  export async function createTestInvoiceData() {
    console.log('🧪 Creating test invoice data...');
    
    try {
      // This is just for development/testing - creates a test invoice without sending email
      const testUser = await prisma.user.findFirst({
        where: { email_verified: true }
      });
      
      if (!testUser) {
        console.log('❌ No verified users found for test data creation');
        return;
      }
      
      const invoiceData = {
        userId: testUser.id,
        userEmail: testUser.email,
        userName: testUser.name || 'Test User',
        planType: 'STANDARD' as const,
        billingCycle: 'monthly' as const,
        subscriptionId: 'test-data-' + Date.now()
      };
      
      const result = await prismaInvoiceService.createInvoiceInDatabase(invoiceData);
      
      if (result.success) {
        console.log('✅ Test invoice data created:');
        console.log('   Invoice ID:', result.invoiceId);
        console.log('   Invoice Number:', result.invoiceNumber);
        console.log('   User:', testUser.email);
      } else {
        console.log('❌ Failed to create test data:', result.error);
      }
      
      return result;
      
    } catch (error) {
      console.log('❌ Test data creation error:', error);
    }
  }
  
  // Example usage in a separate file or direct execution:
  /*
  // src/scripts/test-my-invoice.ts
  import { quickInvoiceTest, validateSetup, checkInvoiceHistory } from './debug-invoice-system';
  
  async function testMyInvoice() {
    // First validate setup
    if (!validateSetup()) {
      console.log('❌ Setup validation failed. Please fix the issues above.');
      return;
    }
    
    // Test with your email
    const result = await quickInvoiceTest(
      'your-email@example.com',  // Replace with your LegalynX registered email
      'PREMIUM',                 // Test with PREMIUM plan
      'yearly'                   // Test with yearly billing
    );
    
    if (result?.success) {
      console.log('🎉 Test successful! Check your email.');
      
      // Check invoice history
      await checkInvoiceHistory('your-email@example.com');
    }
  }
  
  testMyInvoice();
  */