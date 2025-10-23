# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-10-23

## 🚀 What's New
- **File Type Validation:** Implemented intelligent file upload validation to distinguish between legal and non-legal documents, ensuring only relevant files are processed.
- **Enhanced Landing Page:** Introduced a new landing page with richer information, visuals, and detailed descriptions about Legalynx’s features and plans.

## 🛠️ Fixes
- **DOCX Conversion:** Fixed DOCX conversion not working when uploading .docx file.

### ⚙️ Technical Changes
- **Unified Text Extraction:** Optimized backend performance by running text extraction once per document upload, reducing redundant processing in the RAG pipeline.


## [0.3.9] - 2025-10-11 - Post-Consultation QA

## 🚀 What's New
- **Voice Mode Upgrade:** Switched to OpenAI Nova model for improved voice interaction quality and overall user experience.
- **Source Attribution Redesign:** Fully reworked source attribution parsing logic for clearer and more structured reference display.

## 🛠️ Fixes
- **Branching & Regeneration:** Resolved issue where conversation branching and response regeneration were producing incorrect or duplicate threads.
- **Billing Invoice Email:** Fixed bug preventing invoices from being sent to registered email addresses.
- **RAG Pipeline Renaming:** Updated naming process from regex-assisted sanitization to direct LLM-driven renaming for improved accuracy.
- **Voice Mode Response Length:** Adjusted to produce shorter, more concise responses for audio output.

## [0.3.8] - 2025-10-07 - Pre-Defense QA

### 🚀 What's New
- **Account Protection:** Implemented anti-brute-force mechanism that locks accounts for 24 hours after 5 failed login attempts
- **Email Validation:** Added acceptable email domains list to prevent burner accounts and temporary email registrations
- **Billing History:** Users can now view complete billing history and invoices directly on the Subscription page
- **Invoice Delivery:** PDF invoices are now automatically sent to registered email addresses
- **Message Branching:** Added support for conversation branching when regenerating or editing responses


### 🛠️ Fixes
- **File Storage Display:** Adjusted file size display to automatically adapt between KB/MB/GB units for better readability
- **Duplicate Invoice:** Fix a bug that duplicates the generation of invoice

### ⚙️ Technical Changes
- **System Prompt Refinement:** Updated system prompt to focus on text-based extraction and generation, removing multi-modal references

### ⛔ Removed
- **Landing Page:** Removed unnecessary information to streamline content for panel review

## [0.3.7] - 2025-10-06

### 🛠️ Fixes
- **Response Time Optimization:** Reduced overall system latency by changing the model’s reasoning, leading to faster generation and output delivery.
- **Streaming Response Refined:** Improved the live token streaming so answers appear in real time as they’re generated, improving interactivity and responsiveness.
- **Non-Document Query Handler:** Added a dedicated response handler to properly manage general (non-document) user queries outside the RAG context.
- **File Upload Error Handling:** Resolved an issue where failed uploads were incorrectly appearing in chat history; these are now properly flagged and isolated.

### 🧩 UI Changes
- **Updated Session Loader:** Changed the session loader component UI to a more unified and simple interface.
- **Profile Settings Redesign:** Updated the layout of the profile settings page for better readability, accessibility, and user navigation flow.
- **RAG Thinking Lock:** Disabled the “Send” button while the RAG pipeline is processing or thinking, preventing duplicate requests and ensuring smoother UX.

## [0.3.6] - 2025-10-01

### 🚀 What's New
- **Adaptive Multi-Question Processing:** Implemented intelligent query analysis that detects and optimizes handling of multi-question queries
- **Enhanced Retrieval System:** Added hybrid Vector + BM25 retrieval with automatic configuration based on document size and query complexity
- **Smart Context Building:** Improved token budgeting with adaptive chunk selection and prioritization for comprehensive multi-question responses

### 🛠️ Fixes
- **RAG System Detection:** Fixed critical bug where streaming engine couldn't detect RAG system parameters, causing fallback to basic retrieval
- **Page Count Issue:** Resolved issue where `total_pages` was stored as function reference instead of integer value, breaking adaptive configuration
- **Embedding Manager Integration:** Fixed missing `embedding_manager` parameter extraction in streaming query engine
- **Multi-Question Support:** Enabled `MultiQuestionBatchProcessor` for queries with multiple questions, providing better answer coverage and accuracy

### ⚙️ Technical Changes
- **Streaming Engine Enhancement:** Added comprehensive parameter passing (`vector_index`, `nodes`, `embedding_manager`, `total_pages`) to enable adaptive query processing
- **Debug Logging:** Added detailed debug output for RAG system parameter extraction to improve troubleshooting
- **Import Cleanup:** Removed unused `pymupdf.extra.page_count` import that was causing naming conflicts
- **RAG Builder Optimization:** Enhanced `VectorizedRAGBuilder.build_rag_system_fast()` to properly calculate and store page count from PDF files
- **Entity Detection:** Automatic extraction and prioritized retrieval of named entities from multi-question queries
- **Batch Processing:** Single-pass retrieval and reranking for multiple questions, reducing latency and improving efficiency
- **Adaptive Configuration:** Dynamic adjustment of retrieval parameters based on document size (pages) and query complexity (number of questions)
- **Enhanced Deduplication:** Improved node deduplication with diversity optimization through interleaved retrieval results

## [0.3.5] - 2025-09-30

### 🚀 What's New
- **Chat Message Animations:** Added smooth slide-in animations for user and assistant messages
- **Smooth Scrolling:** Chat container now scrolls smoothly to new messages
- **Message Management:** Added delete button for individual chat messages
- **Rename Chat Title:** Added a rename chat title feature for customizability

### 🛠️ Fixes
- **Stop Button:** Fixed streaming response abort functionality - stop button now properly cancels ongoing responses
- **React setState Error:** Resolved persistent "Cannot update a component while rendering a different component" error by deferring callback invocations
- **Message Rendering:** Improved streaming response handling with proper cursor states

### ⚙️ Technical Changes
- **Backend Configuration:** Updated RAG pipeline config with new optimization flags
- **API Client:** Enhanced `streamQueryDocument` with AbortSignal support for request cancellation
- **Component Lifecycle:** Fixed state management timing issues in Home and ChatViewer components

## [0.3.4] - 2025-09-28

### 🚀 What's New
- **Response Streaming:** Now uses response streaming from OpenAI for faster response time
- **Landing Page Refinements:** Added some visual refinements on the landing page

### 🛠️ Fixes
- **File Renaming:** Fixed file renames the original file instead of the uploaded (renamed) file

## [0.3.3] - 2025-09-20

### 🚀 What's New
- **Subscription Invoice:** Subscriptions now automatically send invoices to the registered email.
- Canceling a subscription now stops future payments but keeps access until the billing cycle ends.
- **[FIX]** Voice Mode: improved stability and removed the outdated visualizer.

## [0.3.2] - 2025-09-17

### 🚀 What's New
- **Forgot Password:** Users can now securely reset their password.
- **Password Visibility Toggle:** Option to show or hide password text during entry.
- **Security Logs Relocation:** Security logs are now housed under _Privacy & Security_ for a more streamlined experience.
- **Subscription Tab:** A new subscription section has been added to the home page.
- **Internal Testing Support:** Introduced dedicated test scripts to improve QA workflows.

### 🛠️ Fixes
- **Code Settings Page:** Refactored for improved stability and maintainability.

## [0.3.1] - 2025-09-11
### 🚀 What's New
- **View File Button:** Introduced a quick-access button to open and view uploaded files directly from the chat interface
- **Payment Gateway Integration:** Integrated PayPal as payment gateway for subscription
- **Delete Account API:** Backend endpoint for permanent account deletion is now available

### 🛠️ Fixed
- **Sidebar Menu Consistency on Mobile View:** Moved the sidebar open toggle to the navigation bar for UI consistency
- **Confirmation Modal:**  Switched the delete confirmation on chat history to the existing confirmation modal for code and UI consistency

## [0.3.0] - 2025-09-08

⚠️ Note: We skipped version 0.2.3 to 0.2.x in order to align with the scope of new features and improvements. The jump reflects a larger set of changes that warranted a minor version bump.

### 🚀 What's New

- **GPT 5-mini integration:** the pipeline now runs on OpenAI’s GPT 5-nano model (previously Gemini Flash 2.0).  
- **Smarter responses:** improved verbosity and reasoning making the assistant more helpful and proactive in asking clarifying questions.  
- **Dynamic markdown rendering:** assistant responses now support bold, italic, and underline formatting.  
- **Per-message deletion:** users can delete specific messages without losing the full conversation.  
- **Abort response generation:** added a stop button to cancel outputs mid-response.  
- **Context timer:** displays elapsed time for better user context-awareness.  

### 🛠️ Fixed
- **UI polishing:** adjusted sizing, margins, color contrast, and other visual elements for consistency. 
- **Improved error handling:** error prompts now provide clearer, user-friendly information.  

### ⛔ Removed

- **Response feedback:** thumbs up/down feature removed since feedback isn’t used for training.  
- **Usage statistics:** simplified subscription page by removing usage tracking.  

---

## [0.2.2] - 2025-08-15
### 🛠️ Fixed
- **Smarter auto-rename:** feature now powered by rule-based pattern matching (previously regex only) for higher accuracy.  

### 🧩 UI Changes
- **Add Client Name Format**: Replaced sequential_numbering with add client name format (20250815_Client_Document.pdf)

## [0.2.1] - 2025-08-12
### Added
- **Password Validation**: Added password strength meter on account creation

### Changed
- **Hero Image**: Changed hero image on landing page to LegalynX logo
- **Sign In Buttons**: Added loading animation on button submit for enhanced user feedback
- **Sunset Theme**: Fixed sunset theme for better readability
- **Changed Icons**: Changed Folder and File icons for better UI

## [0.2.0] - 2025-08-11

### Added
- **Live Usability Testing**: Deployed production testing environment on Vercel
- **Collapsible Icon Feature**: Added collapsible interface elements for improved navigation
- **Layout Rearrangement**: Enhanced UI layout for better user experience
- **Appearance Tab**: New appearance customization options in settings
- **Single Document ID Implementation**: Streamlined document identification system

### Fixed
- **Message Persistence**: Resolved bug where messages weren't saving on initial file upload
- **File Upload Selection**: Fixed issue where recently uploaded files were incorrectly auto-selected
- **Session Management**: Fixed bug where temporary sessions weren't saved to chat history when switching tabs

### Changed
- **RAG Pipeline Hosting**: Migrated RAG backend to Railway for improved performance and reliability

### Removed
- **Privacy Settings**: Removed privacy preferences settings for simplified user experience

--- 

## [0.1.9] - 2025-08-05 - Pre-Alpha

### Added
- **RAG Hosting on Railway**: Deployed the Retrieval-Augmented Generation (RAG) backend on Railway for production testing
- **Folder/File Nesting**: Introduced support for nested folders and files in the File Manager

### Fixed
- **Mobile Responsiveness**: Addressed additional minor UI issues on smaller screen sizes

### Changed
- **Component Structure**: Refactored the `components/` directory for improved organization and scalability

## [0.1.8] - 2025-08-01

### Added
- **Tier Restriction**: Users can now access the system based on their subscription plan.
- **Fixed Dark/Light mode on Landing page**: Minor UI changes for landing page and pricing page.
- **Added Privacy Policy**: Added privacy policy for users

## [0.1.7] - 2025-07-30

### Added
- **Dark Mode**: Added dark mode feature across the system
- **Revamped User Interface**: Changed the Landing and Pricing page with informational content 

## [0.1.6] - 2025-07-28

### Added
- **Two-Factor Authentication (2FA)**: Users can now enable 2FA with their preferred authenticator app for enhanced security
- **Edit Feature**: Users can now edit their prompts and automatically regenerate responses
- **Profile Picture Management**: Complete profile picture upload, display, and removal functionality
- **Secure S3 Integration**: Profile pictures are stored securely in S3 with public access via bucket policy
- **Direct S3 URL Display**: Profile pictures now load instantly without API calls or loading states

### Fixed
- **System Settings**: Now dynamically updates user settings in real-time
- **Profile Picture Upload**: Fixed S3 upload issues and database persistence
- **Image Loading**: Eliminated loading states and fallback transitions in navigation
- **S3 Security**: Implemented secure bucket policy for profile pictures while keeping documents private
- **Authentication**: Improved JWT token handling in navigation components

### Security
- **Document Privacy**: Ensured all documents remain private and accessible only through authenticated API calls


## [0.1.5] - 2025-07-24

### Added
- **RAG Anomaly Detection**: Added security layer for prompt injection detection, user behavior monitoring, and rate limiting for file uploads
- **File Auto-Rename Feature**: Automatically handles file naming conflicts
- **Enhanced User Experience**: Added smooth animations on sidebar tab selection
- **Document Format Support**: Added `.docx` support with automatic conversion to `.pdf` files

### Improved
- **RAG Pipeline Optimization**: Significantly faster document processing performance


## [0.1.4] - 2025-07-19

### Added
- **Settings Page**: Comprehensive user settings management
- **Voice Mode**: Users can now interact with Lynx AI using voice commands
- **Gemini Flash Model Integration**: Improved response quality and speed

### Fixed
- **Mobile Responsiveness**: Enhanced UI/UX compatibility for mobile and small screen devices

## [0.1.3] - 2025-07-17

### Added
- **PDF Viewer**: Integrated PDF viewer in File Manager for document preview

### Fixed
- **Chat Session Loading**: Resolved errors when loading deleted or non-existent chat sessions
- **Default Page**: Login now correctly defaults to upload file page

## [0.1.2] - 2025-07-15

### Added
- **S3 Integration**: Complete Amazon S3 integration for file storage
- **Session Management**: Polished session-based chat and file handling

### Fixed
- **File/Chat Deletion**: Resolved bugs when deleting files or chat history
- **Session Isolation**: Fixed issue where chat sessions could be accessed by wrong users
- **Logout Cleanup**: Logging out now properly removes unsaved files and sessions
- **Versioning**: Adjusted CHANGELOG versioning for consistency

## [0.1.1] - 2025-07-12

### Added
- **CHANGELOG**: Added changelog for better version history tracking
- **Animations**: Small UI animations for improved user experience
- **Authentication System**: Complete sign in and sign up functionality
- **Database Setup**: PostgreSQL and Prisma ORM integration
- **Containerization**: Docker support for streamlined deployment

### Fixed
- **Navigation**: Improved routing for header links and page navigation

## [0.1.0] - 2025-07-10 - Initial Release

### Initialized
- **RAG Pipeline**: Built Retrieval-Augmented Generation pipeline using FastAPI
- **Application Structure**: Setup Frontend (Next.js) and Backend (Node.js) architecture
- **Docker Support**: Complete containerization for development and production
- **Configuration**: Initial project configuration files and environment setup

---

## Legend

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements