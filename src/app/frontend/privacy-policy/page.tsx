import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="text-center py-6 px-8 border-b-2 border-gray-200">
            <div className="text-4xl font-bold font-serif text-blue-600 mb-2">LegalynX</div>
            <div className="text-muted-foreground text-lg">Linking you to legal clarity</div>
          </div>
          
          {/* Content */}
          <div className="px-8 py-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-center text-gray-600 italic mb-8">Effective Date: August 1, 2025</p>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
              <p className="text-gray-700">
                <strong className="text-gray-900">Welcome to LegalynX.</strong> We are committed to protecting your privacy and ensuring the security of your personal information and legal documents. This Privacy Policy explains how we collect, use, store, and protect your information when you use our AI-powered legal document management platform.
              </p>
            </div>

            {/* Section 1 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                1. Information We Collect
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">1.1 Personal Information</h3>
                <p className="text-gray-700 mb-3"><strong>Required Information:</strong></p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>Email address (used for account creation, authentication, and communication)</li>
                  <li>Password (encrypted and stored securely)</li>
                </ul>
                
                <p className="text-gray-700 mb-3"><strong>Optional Information:</strong></p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>Full name</li>
                  <li>Job title</li>
                  <li>Profile picture</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">1.2 Document and File Data</h3>
                <p className="text-gray-700 mb-3">We collect and process documents you upload to our platform, including:</p>
                <ul className="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                  <li>PDF files (including scanned documents processed)</li>
                  <li>DOCX files (automatically converted to PDF)</li>
                  <li>Document metadata (file names, upload dates, file sizes)</li>
                </ul>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg mb-6">
                  <p className="text-blue-900">
                    <strong>Important:</strong> We understand that your legal documents may contain highly sensitive and confidential information. All documents are encrypted and stored securely with access limited to your account only.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">1.3 Usage and Interaction Data</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Chat logs and conversation history with our AI assistant</li>
                  <li>User preferences and settings</li>
                  <li>System performance and error logs (anonymized)</li>
                </ul>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                2. How We Use Your Information
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Core Service Functionality</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Provide AI-powered document analysis and legal insights</li>
                  <li>Process and index your documents for searchability</li>
                  <li>Maintain chat sessions and conversation history</li>
                  <li>Enable document management and organization features</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Account Management</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Create and maintain your user account</li>
                  <li>Authenticate your identity and secure your account</li>
                  <li>Send important service-related communications</li>
                  <li>Process payments and billing (through PayMongo)</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Service Improvement</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Improve our AI models and algorithms</li>
                  <li>Enhance platform performance and user experience</li>
                  <li>Develop new features and capabilities</li>
                </ul>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                3. AI Processing and Third-Party Services
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 AI Model Processing</h3>
                <p className="text-gray-700 mb-4">
                  We use OpenAI's GPT-4.1 mini model to process your documents and provide AI-powered insights. Your document content is sent to OpenAI's API for processing but is not used by OpenAI to train their models.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Third-Party Service Providers</h3>
                <p className="text-gray-700 mb-3">We work with the following trusted third-party providers:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>SendGrid:</strong> Email delivery service for account notifications and communications</li>
                  <li><strong>PayMongo:</strong> Payment processing for subscription and billing services</li>
                  <li><strong>Amazon S3:</strong> Secure cloud storage for your documents and files</li>
                  <li><strong>NeonDB:</strong> Database hosting for account information and metadata</li>
                </ul>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                4. Data Storage and Security
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Storage Infrastructure</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Documents:</strong> Stored securely in Amazon S3 with encryption at rest</li>
                  <li><strong>Database:</strong> User accounts and metadata stored in NeonDB with industry-standard security</li>
                  <li><strong>Encryption:</strong> All data is encrypted both in transit and at rest</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Security Measures</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>JWT-based authentication with secure token management</li>
                  <li>Role-based access control</li>
                  <li>Two-factor authentication (2FA) available</li>
                  <li>Regular security monitoring and anomaly detection</li>
                  <li>Environment-managed API keys and credentials</li>
                </ul>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                5. Your Privacy Rights and Controls
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Account Settings</h3>
                <p className="text-gray-700 mb-3">You have full control over your privacy settings, including:</p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Notification settings</li>
                  <li>Security alert preferences</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Data Access and Portability</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Access all your personal data and documents through your account</li>
                  <li>Download your documents at any time</li>
                  <li>Export your chat history and conversation data</li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-medium text-gray-800 mb-3">5.3 Data Deletion</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Delete individual documents and chat sessions</li>
                  <li>Delete your entire account and all associated data</li>
                  <li>Request complete data removal from our systems</li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                6. Data Retention
              </h2>
              
              <p className="text-gray-700 mb-3">We retain your data for as long as your account remains active. Specifically:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Documents:</strong> Stored until you delete them or close your account</li>
                <li><strong>Chat Logs:</strong> Maintained for your reference until deletion</li>
                <li><strong>After Account Deletion:</strong> All personal data and documents are permanently deleted within 30 days</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                7. Data Sharing and Disclosure
              </h2>
              
              <p className="text-gray-700 mb-3">We do not sell, rent, or share your personal information or documents with third parties, except:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations or court orders</li>
                <li>To protect our rights, property, or safety, or that of our users</li>
                <li>In connection with a business transfer or acquisition (with prior notice)</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                8. International Data Transfers
              </h2>
              
              <p className="text-gray-700">
                Your data may be processed and stored in servers located outside your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with applicable privacy laws.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                9. Children's Privacy
              </h2>
              
              <p className="text-gray-700">
                LegalynX is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children under 18 years of age.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                10. Changes to This Privacy Policy
              </h2>
              
              <p className="text-gray-700 mb-3">We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Posting the updated policy on our website</li>
                <li>Sending you an email notification</li>
                <li>Displaying a prominent notice in your account dashboard</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                11. Legal Basis for Processing
              </h2>
              
              <p className="text-gray-700 mb-3">We process your personal information based on the following legal grounds:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Contract Performance:</strong> To provide our services as agreed</li>
                <li><strong>Legitimate Interest:</strong> To improve our services and ensure security</li>
                <li><strong>Consent:</strong> Where you have provided explicit consent</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
              </ul>
            </section>

            {/* Contact Section */}
            <section className="mb-4">
              <div className="bg-gray-100 p-6 rounded-lg border border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
                <p className="text-gray-700 mb-4">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="text-gray-700">
                  <p className="mb-2"><strong>LegalynX Privacy Team</strong></p>
                  <p className="mb-2">Email: privacy@legalynx.com</p>
                  <p className="mb-4">System Developers: Git Merge</p>
                  <p className="italic">We are committed to addressing your privacy concerns promptly and transparently.</p>
                </div>
              </div>
            </section>

            {/* Final Message */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
              <p className="text-blue-900">
                <strong>Your Trust Matters:</strong> At LegalynX, we understand that you're entrusting us with sensitive legal documents and confidential information. We take this responsibility seriously and are committed to maintaining the highest standards of privacy and security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;