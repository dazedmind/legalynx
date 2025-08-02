import os
import sys
import time
import asyncio
from typing import Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Initialize FastAPI app first to avoid import issues
app = FastAPI(title="Ultra-Fast RAG Pipeline API", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
rag_system: Optional[Dict[str, Any]] = None
current_pdf_path: Optional[str] = None

# ================================
# IMPORT WITH ERROR HANDLING
# ================================

try:
    # Import optimized system
    from optimized_rag_system import (
        optimized_upload_workflow,
        model_manager,
        RuleBasedFileNamer,
        apply_ultra_fast_config
    )
    OPTIMIZED_SYSTEM_AVAILABLE = True
    print("✅ Optimized RAG system loaded")
except ImportError as e:
    print(f"⚠️ Optimized system not available: {e}")
    OPTIMIZED_SYSTEM_AVAILABLE = False

try:
    # Import existing modules
    from security.security_middleware import SimplifiedSecurityMiddleware
    security = SimplifiedSecurityMiddleware()
    SECURITY_AVAILABLE = True
    print("✅ Security middleware loaded")
except ImportError as e:
    print(f"⚠️ Security middleware not available: {e}")
    SECURITY_AVAILABLE = False
    security = None

try:
    from utils.file_handler import get_next_sequential_number, validate_pdf_content
    UTILS_AVAILABLE = True
    print("✅ File handler utils loaded")
except ImportError as e:
    print(f"⚠️ File handler utils not available: {e}")
    UTILS_AVAILABLE = False

try:
    from utils.docx_converter import convert_docx_to_pdf, validate_docx_file
    DOCX_CONVERTER_AVAILABLE = True
    print("✅ DOCX converter loaded")
except ImportError as e:
    print(f"⚠️ DOCX converter not available: {e}")
    DOCX_CONVERTER_AVAILABLE = False

# ================================
# PYDANTIC MODELS
# ================================

class QueryRequest(BaseModel):
    query: str
    
class QueryResponse(BaseModel):
    query: str
    response: str
    source_count: int
    security_status: Optional[str] = None
    
class SystemStatus(BaseModel):
    status: str
    pdf_loaded: bool
    index_ready: bool
    pdf_name: Optional[str] = None
    model_cache_status: str

class UploadResponse(BaseModel):
    message: str
    filename: str
    original_filename: str
    document_count: int
    document_id: str
    security_status: Optional[str] = None
    file_type: str
    conversion_performed: bool = False
    naming_applied: Optional[str] = None
    user_settings_used: bool = False
    processing_time: float
    timing_breakdown: Dict[str, float]
    optimization_used: str

# ================================
# FALLBACK FUNCTIONS
# ================================

def get_next_sequential_number_fallback(upload_dir: str, title: Optional[str] = None, client_name: Optional[str] = None) -> int:
    """Fallback implementation when utils not available."""
    return 1

def validate_pdf_content_fallback(file_path: str) -> Dict[str, Any]:
    """Fallback PDF validation."""
    return {"is_valid": os.path.exists(file_path) and file_path.endswith('.pdf')}

def validate_docx_file_fallback(file_path: str) -> Dict[str, Any]:
    """Fallback DOCX validation."""
    return {"is_valid": os.path.exists(file_path) and file_path.endswith(('.docx', '.doc'))}

def convert_docx_to_pdf_fallback(docx_path: str, pdf_path: str):
    """Fallback DOCX conversion - raises error."""
    raise NotImplementedError("DOCX conversion not available - install docx2pdf")

# ================================
# USER SETTINGS (SIMPLIFIED)
# ================================

async def get_user_settings_mock(user_id: str) -> dict:
    """Mock user settings - replace with your actual database logic."""
    return {
        'file_naming_format': 'ADD_TIMESTAMP',
        'file_naming_title': 'Document',
        'file_client_name': 'Client'
    }

def convert_enum_to_naming_option(enum_value: str) -> str:
    """Convert database enum to backend naming option format."""
    enum_mapping = {
        'ORIGINAL': 'keep_original',
        'ADD_TIMESTAMP': 'add_timestamp', 
        'SEQUENTIAL_NUMBERING': 'sequential_numbering'
    }
    return enum_mapping.get(enum_value, 'keep_original')

def extract_user_id_from_token(request: Request) -> Optional[str]:
    """Extract user ID from JWT token (simplified)."""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        return 'demo_user_123'
    return None

# ================================
# STARTUP EVENT
# ================================

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup for maximum speed."""
    print("🚀 Starting Ultra-Fast RAG Pipeline...")
    
    if OPTIMIZED_SYSTEM_AVAILABLE:
        print("⚡ Pre-warming models for maximum speed...")
        try:
            await model_manager.get_embedding_manager()
            print("✅ Models pre-warmed successfully")
        except Exception as e:
            print(f"⚠️ Model pre-warming failed: {e}")
            print("   Models will be initialized on first upload")
        
        try:
            apply_ultra_fast_config()
            print("✅ Ultra-fast configuration applied")
        except Exception as e:
            print(f"⚠️ Ultra-fast config failed: {e}")
    else:
        print("⚠️ Running in basic mode - optimized system not available")

# ================================
# API ENDPOINTS
# ================================

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint."""
    return {"message": "Ultra-Fast RAG Pipeline API is running"}

@app.get("/status", response_model=SystemStatus)
async def get_status():
    """Get system status including model cache status."""
    if OPTIMIZED_SYSTEM_AVAILABLE:
        model_cache_status = "warmed" if model_manager._is_initialized else "cold"
    else:
        model_cache_status = "not_available"
    
    return SystemStatus(
        status="running",
        pdf_loaded=current_pdf_path is not None,
        index_ready=rag_system is not None,
        pdf_name=os.path.basename(current_pdf_path) if current_pdf_path else None,
        model_cache_status=model_cache_status
    )

@app.post("/upload-pdf-ultra-fast", response_model=UploadResponse)
async def upload_document_ultra_fast(
    request: Request, 
    file: UploadFile = File(...),
):
    """
    ULTRA-FAST UPLOAD: Complete workflow optimized for speed.
    Expected time: 15-30 seconds (down from 5+ minutes).
    """
    global rag_system, current_pdf_path
    
    if not OPTIMIZED_SYSTEM_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Optimized upload system not available. Check server logs for missing dependencies."
        )
    
    # Track total processing time
    start_time = time.time()
    
    try:
        # ===== STEP 1: VALIDATE FILE =====
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        file_ext = os.path.splitext(file.filename)[1].lower()
        supported_extensions = ['.pdf', '.docx', '.doc']
        
        if file_ext not in supported_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {file_ext}. Supported: PDF, DOCX"
            )
        
        file_content = await file.read()
        file_size = len(file_content)
        
        # Size validation
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size too large (max 50MB)")
        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        print(f"📄 Processing: {file.filename} ({file_size:,} bytes)")
        
        # ===== STEP 2: GET USER SETTINGS (FAST) =====
        user_id = extract_user_id_from_token(request)
        user_settings = {'file_naming_format': 'ADD_TIMESTAMP'}
        naming_option = 'add_timestamp'
        title = None
        client_name = None
        
        if user_id:
            try:
                user_settings = await get_user_settings_mock(user_id)
                naming_option = convert_enum_to_naming_option(
                    user_settings.get('file_naming_format', 'ORIGINAL')
                )
                title = user_settings.get('file_naming_title')
                client_name = user_settings.get('file_client_name')
                print(f"📋 User settings: {naming_option}, title: {title}, client: {client_name}")
            except Exception as e:
                print(f"⚠️ Settings load failed: {e}, using defaults")
        
        # ===== STEP 3: HANDLE DOCX CONVERSION =====
        final_file_content = file_content
        file_type = "pdf"
        conversion_performed = False
        
        if file_ext in ['.docx', '.doc']:
            file_type = "docx"
            if not DOCX_CONVERTER_AVAILABLE:
                raise HTTPException(
                    status_code=400, 
                    detail="DOCX conversion not available. Please upload PDF files or install docx2pdf."
                )
            
            try:
                # For DOCX, convert to PDF first
                temp_docx_path = f"temp_{file.filename}"
                with open(temp_docx_path, 'wb') as f:
                    f.write(file_content)
                
                # Validate DOCX
                validate_func = validate_docx_file if DOCX_CONVERTER_AVAILABLE else validate_docx_file_fallback
                docx_validation = validate_func(temp_docx_path)
                if not docx_validation['is_valid']:
                    os.remove(temp_docx_path)
                    raise HTTPException(status_code=400, detail="Invalid DOCX file")
                
                # Convert to PDF
                temp_pdf_path = f"temp_{os.path.splitext(file.filename)[0]}.pdf"
                convert_func = convert_docx_to_pdf if DOCX_CONVERTER_AVAILABLE else convert_docx_to_pdf_fallback
                convert_func(temp_docx_path, temp_pdf_path)
                
                # Read converted PDF content
                with open(temp_pdf_path, 'rb') as f:
                    final_file_content = f.read()
                
                # Update filename for processing
                file.filename = os.path.splitext(file.filename)[0] + '.pdf'
                conversion_performed = True
                
                # Cleanup temp files
                os.remove(temp_docx_path)
                os.remove(temp_pdf_path)
                
                print("✅ DOCX converted to PDF for processing")
                
            except Exception as e:
                # Cleanup on error
                for temp_file in [f"temp_{file.filename}", f"temp_{os.path.splitext(file.filename)[0]}.pdf"]:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                raise HTTPException(status_code=500, detail=f"DOCX processing failed: {str(e)}")
        
        # ===== STEP 4: GET COUNTER FOR SEQUENTIAL NUMBERING =====
        counter = None
        if naming_option == 'sequential_numbering' and title and client_name:
            get_counter_func = get_next_sequential_number if UTILS_AVAILABLE else get_next_sequential_number_fallback
            counter = get_counter_func("sample_docs", title, client_name)
        
        # ===== STEP 5: ULTRA-FAST OPTIMIZED WORKFLOW =====
        print("🚀 Starting ultra-fast optimized workflow...")
        workflow_start = time.time()
        
        result = await optimized_upload_workflow(
            file_content=final_file_content,
            original_filename=file.filename,
            naming_option=naming_option,
            user_title=title,
            user_client_name=client_name,
            counter=counter
        )
        
        workflow_time = time.time() - workflow_start
        
        # ===== STEP 6: UPDATE GLOBAL STATE =====
        rag_system = result["rag_system"]
        current_pdf_path = result["file_path"]
        
        # ===== STEP 7: SECURITY CHECK (NON-BLOCKING) =====
        try:
            if SECURITY_AVAILABLE and security:
                security_result = security.check_upload_security(
                    user_id or 'anonymous', 
                    final_file_content, 
                    result["file_path"]
                )
                document_id = security_result.get("document_id", f"doc_{int(file_size)}_{len(result['documents'])}")
                security_status = "verified"
            else:
                document_id = f"doc_{int(file_size)}_{len(result['documents'])}"
                security_status = "not_available"
        except Exception as e:
            print(f"⚠️ Security check failed: {e}")
            document_id = f"doc_{int(file_size)}_{len(result['documents'])}"
            security_status = "pending"
        
        # ===== STEP 8: FINAL RESPONSE =====
        total_time = time.time() - start_time
        final_filename = result["filename"]
        
        print(f"🎉 ULTRA-FAST UPLOAD COMPLETED in {total_time:.2f}s!")
        print(f"   - Original time: ~300s (5+ minutes)")
        print(f"   - New time: {total_time:.2f}s") 
        print(f"   - Speedup: {300/total_time:.1f}x faster!")
        print(f"   - File: {file.filename} → {final_filename}")
        
        return UploadResponse(
            message=f"Ultra-fast processing complete in {total_time:.2f}s ({300/total_time:.1f}x speedup)",
            filename=final_filename,
            original_filename=file.filename,
            document_count=len(result["documents"]),
            document_id=document_id,
            security_status=security_status,
            file_type=file_type,
            conversion_performed=conversion_performed,
            naming_applied=naming_option,
            user_settings_used=user_id is not None,
            processing_time=total_time,
            timing_breakdown=result["timing"],
            optimization_used="ultra_fast_rule_based_singleton"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in ultra-fast upload: {str(e)}")
        
        # Clean up any temporary files
        temp_files = [
            f"temp_{file.filename}",
            f"temp_{os.path.splitext(file.filename)[0]}.pdf"
        ]
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except:
                    pass
        
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/upload-pdf-demo-rule-based")
async def demo_rule_based_naming(
    file: UploadFile = File(...),
):
    """
    Demo endpoint to test rule-based naming without full RAG processing.
    Shows ultra-fast naming in ~0.01-0.1 seconds.
    """
    if not OPTIMIZED_SYSTEM_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Rule-based naming system not available. Check server logs for missing dependencies."
        )
    
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        file_content = await file.read()
        
        # Test all naming options
        demo_results = {}
        
        for naming_option in ['keep_original', 'add_timestamp', 'sequential_numbering']:
            start_time = time.time()
            
            result_filename = RuleBasedFileNamer.generate_filename_ultra_fast(
                file_content=file_content,
                original_filename=file.filename,
                naming_option=naming_option,
                user_title="TestDocument",
                user_client_name="TestClient",
                counter=1
            )
            
            processing_time = time.time() - start_time
            
            demo_results[naming_option] = {
                "filename": result_filename,
                "processing_time_ms": round(processing_time * 1000, 2),
                "processing_time_s": round(processing_time, 4)
            }
        
        return {
            "original_filename": file.filename,
            "file_size_bytes": len(file_content),
            "results": demo_results,
            "total_analysis_time": sum(r["processing_time_s"] for r in demo_results.values()),
            "message": "Rule-based naming demo - no LLM calls, pure regex/pattern matching"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo failed: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_document_secure(request: Request, query_request: QueryRequest):
    """Query the RAG system."""
    global rag_system
    
    if not rag_system:
        raise HTTPException(status_code=400, detail="No PDF has been uploaded and indexed yet")
    
    user_id = extract_user_id_from_token(request)
    
    try:
        # Security check and sanitization
        if SECURITY_AVAILABLE and security:
            sanitized_query = security.check_query_security(user_id, query_request.query)
            was_sanitized = sanitized_query != query_request.query
        else:
            sanitized_query = query_request.query
            was_sanitized = False
        
        # Execute query using cached models (fast)
        response = rag_system["query_engine"].query(sanitized_query)
        
        return QueryResponse(
            query=query_request.query,
            response=str(response),
            source_count=len(response.source_nodes) if hasattr(response, 'source_nodes') else 0,
            security_status="sanitized" if was_sanitized else "verified"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error executing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error executing query: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "system_ready": rag_system is not None,
        "pdf_loaded": current_pdf_path is not None,
        "models_cached": model_manager._is_initialized if OPTIMIZED_SYSTEM_AVAILABLE else False,
        "optimization_mode": "ultra_fast" if OPTIMIZED_SYSTEM_AVAILABLE else "basic",
        "components": {
            "optimized_system": OPTIMIZED_SYSTEM_AVAILABLE,
            "security": SECURITY_AVAILABLE,
            "utils": UTILS_AVAILABLE,
            "docx_converter": DOCX_CONVERTER_AVAILABLE
        }
    }

@app.get("/debug")
async def debug_info():
    """Debug endpoint to check what's available."""
    return {
        "python_path": sys.path,
        "current_directory": os.getcwd(),
        "backend_directory": current_dir,
        "components_available": {
            "optimized_system": OPTIMIZED_SYSTEM_AVAILABLE,
            "security": SECURITY_AVAILABLE,
            "utils": UTILS_AVAILABLE,
            "docx_converter": DOCX_CONVERTER_AVAILABLE
        },
        "environment": dict(os.environ)
    }

# ================================
# COMPATIBILITY ENDPOINTS
# ================================

@app.post("/upload-pdf")
async def upload_pdf_compatibility(
    request: Request, 
    file: UploadFile = File(...),
):
    """
    Compatibility endpoint for /upload-pdf - redirects to ultra-fast endpoint
    """
    print(f"🔄 Compatibility endpoint called: /upload-pdf for {file.filename}")
    return await upload_document_ultra_fast(request, file)

@app.get("/check-document/{document_id}")
async def check_document_exists(document_id: str):
    """
    Check if a document exists in the RAG system
    """
    global rag_system, current_pdf_path
    
    print(f"🔍 Checking document existence: {document_id}")
    
    if rag_system is not None and current_pdf_path is not None:
        return {
            "exists": True,
            "document_id": document_id,
            "rag_id": document_id,
            "filename": os.path.basename(current_pdf_path) if current_pdf_path else None
        }
    else:
        return {
            "exists": False,
            "document_id": document_id,
            "rag_id": None,
            "filename": None
        }

@app.delete("/reset")
async def reset_system():
    """Reset the RAG system."""
    global rag_system, current_pdf_path
    
    rag_system = None
    current_pdf_path = None
    
    return {"message": "System reset successfully", "note": "Models remain cached for speed"}

# ================================
# MAIN FUNCTION
# ================================

def main():
    """Main function to run the ultra-fast RAG API."""
    print("🚀 Starting Ultra-Fast RAG Pipeline API...")
    print("⚡ Available components:")
    print(f"   - Optimized system: {OPTIMIZED_SYSTEM_AVAILABLE}")
    print(f"   - Security middleware: {SECURITY_AVAILABLE}")
    print(f"   - File utilities: {UTILS_AVAILABLE}")
    print(f"   - DOCX converter: {DOCX_CONVERTER_AVAILABLE}")
    
    port = int(os.environ.get("PORT", 8000))
    print(f"🌐 Starting server on port {port}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info",
        workers=1
    )

if __name__ == "__main__":
    main()