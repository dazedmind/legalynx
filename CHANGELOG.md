## [0.1.5] - 2025-07-24
**NEW**
- RAG Anomaly Detection. Adds a layer of security for prompt injection, user behavior, and rate limiter for file uploads.
- File auto-rename feature
- Added animations on sidebar tab selection for enhanced user experience.
- Optimized Rag Pipeline for faster document processing.
- **Added `.docx` support**: Automatically converts `.docx` file into `.pdf` files. 

## [0.1.4] - 2025-07-19
**NEW**
- Added Settings Page
- Voice Mode: Users can now use voice to interact with Lynx AI
- Uses Gemini Flash Model for better response

**FIXED**
- UI/UX responsiveness on mobile or small screen size


## [0.1.3] - 2025-07-17
- Added PDF Viewer on File Manager

**Fixed**
- Error when loading a deleted/nonexistent chat session
- Every login, now defaults to upload file page


## [0.1.2] - 2025-07-15
**NEW**
- S3 Integration
- Polished session-based chats and files

**FIXED**
- Bug when deleting a file/chat history
- Chat sessions gets picked up by another user 
- Adjustment on CHANGELOG versioning
- Logging out now removes unsaved files and session

## [0.1.1] - 2025-07-12

- **ADDED**: Added CHANGELOG for better history tracking
- **ADDED**: Small animations for better user experience
- **Authentication**: Added sign in and sign up feature
- PostgreSQL and Prisma Setup
- **Workflow**: Containerized application
- **FIXED**: Routing pages on header and links

## [0.1.0] - Initial Release

### Initialized
- Built RAG pipeline thru FastAPI
- Setup Frontend and Backend Structure
- Docker Support
- Configuration files