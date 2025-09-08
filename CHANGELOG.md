# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-09-08

⚠️ Note: We skipped version 0.2.3 to 0.2.x in order to align with the scope of new features and improvements. The jump reflects a larger set of changes that warranted a minor version bump.

### 🧩 What's new?

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

## [0.2.2] - 2025-08-15
### 🛠️ Fixed
- **Smarter auto-rename:** feature now powered by rule-based pattern matching (previously regex only) for higher accuracy.  

### 🧩 Changed
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

---

## [0.1.5] - 2025-07-24

### Added
- **RAG Anomaly Detection**: Added security layer for prompt injection detection, user behavior monitoring, and rate limiting for file uploads
- **File Auto-Rename Feature**: Automatically handles file naming conflicts
- **Enhanced User Experience**: Added smooth animations on sidebar tab selection
- **Document Format Support**: Added `.docx` support with automatic conversion to `.pdf` files

### Improved
- **RAG Pipeline Optimization**: Significantly faster document processing performance

---

## [0.1.4] - 2025-07-19

### Added
- **Settings Page**: Comprehensive user settings management
- **Voice Mode**: Users can now interact with Lynx AI using voice commands
- **Gemini Flash Model Integration**: Improved response quality and speed

### Fixed
- **Mobile Responsiveness**: Enhanced UI/UX compatibility for mobile and small screen devices

---

## [0.1.3] - 2025-07-17

### Added
- **PDF Viewer**: Integrated PDF viewer in File Manager for document preview

### Fixed
- **Chat Session Loading**: Resolved errors when loading deleted or non-existent chat sessions
- **Default Page**: Login now correctly defaults to upload file page

---

## [0.1.2] - 2025-07-15

### Added
- **S3 Integration**: Complete Amazon S3 integration for file storage
- **Session Management**: Polished session-based chat and file handling

### Fixed
- **File/Chat Deletion**: Resolved bugs when deleting files or chat history
- **Session Isolation**: Fixed issue where chat sessions could be accessed by wrong users
- **Logout Cleanup**: Logging out now properly removes unsaved files and sessions
- **Versioning**: Adjusted CHANGELOG versioning for consistency

---

## [0.1.1] - 2025-07-12

### Added
- **CHANGELOG**: Added changelog for better version history tracking
- **Animations**: Small UI animations for improved user experience
- **Authentication System**: Complete sign in and sign up functionality
- **Database Setup**: PostgreSQL and Prisma ORM integration
- **Containerization**: Docker support for streamlined deployment

### Fixed
- **Navigation**: Improved routing for header links and page navigation

---

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