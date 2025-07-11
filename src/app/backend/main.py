import os
import sys
from typing import Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.file_handler import extract_text_from_pdf, save_uploaded_file
from rag_pipeline.embedder import create_index_from_documents
from rag_pipeline.pipeline_builder import build_complete_rag_system


# Initialize FastAPI app
app = FastAPI(title="RAG Pipeline API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store the RAG system
rag_system: Optional[Dict[str, Any]] = None
current_pdf_path: Optional[str] = None

# Pydantic models for request/response
class QueryRequest(BaseModel):
    query: str
    
class QueryResponse(BaseModel):
    query: str
    response: str
    source_count: int
    
class AnalysisRequest(BaseModel):
    query: str
    show_content: bool = True

class SystemStatus(BaseModel):
    status: str
    pdf_loaded: bool
    index_ready: bool
    pdf_name: Optional[str] = None


@app.get("/", response_model=Dict[str, str])
async def root():
    """
    Root endpoint to check if the API is running.
    """
    return {"message": "RAG Pipeline API is running"}


@app.get("/status", response_model=SystemStatus)
async def get_status():
    """
    Get the current status of the RAG system.
    """
    return SystemStatus(
        status="running",
        pdf_loaded=current_pdf_path is not None,
        index_ready=rag_system is not None,
        pdf_name=os.path.basename(current_pdf_path) if current_pdf_path else None
    )


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF file and create the RAG index.
    
    Args:
        file: PDF file to upload
        groq_api_key: Groq API key for LLM
    """
    global rag_system, current_pdf_path
    
    try:
        # Validate file type
        if not file.filename or not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Read file content
        file_content = await file.read()
        
        # Save uploaded file
        pdf_path = save_uploaded_file(file_content, file.filename or "uploaded_file.pdf")
        current_pdf_path = pdf_path
        
        # Extract text from PDF
        print("📄 Extracting text from PDF...")
        documents = extract_text_from_pdf(pdf_path)
        
        if not documents:
            raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
        
        # Create index
        print("🔧 Building RAG index...")
        vector_index, embedding_manager = create_index_from_documents(
            documents, pdf_path
        )
        
        # Build complete RAG system
        print("🚀 Building RAG pipeline...")
        rag_system = build_complete_rag_system(vector_index, embedding_manager)
        
        return {
            "message": "PDF uploaded and indexed successfully",
            "filename": file.filename,
            "pages_processed": len(documents),
            "status": "ready"
        }
        
    except Exception as e:
        print(f"❌ Error processing PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """
    Query the RAG system with a question.
    
    Args:
        request: Query request containing the question
    """
    global rag_system
    
    if not rag_system:
        raise HTTPException(status_code=400, detail="No PDF has been uploaded and indexed yet")
    
    try:
        # Execute query
        response = rag_system["query_engine"].query(request.query).response
        
        # Get source information
        source_count = len(response.source_nodes) if hasattr(response, 'source_nodes') else 0
        
        return QueryResponse(
            query=request.query,
            response=str(response),
            source_count=source_count
        )
        
    except Exception as e:
        print(f"❌ Error executing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error executing query: {str(e)}")


@app.post("/analyze-query")
async def analyze_query(request: AnalysisRequest):
    """
    Analyze a query and return detailed retrieval information.
    
    Args:
        request: Analysis request containing the query
    """
    global rag_system
    
    if not rag_system:
        raise HTTPException(status_code=400, detail="No PDF has been uploaded and indexed yet")
    
    try:
        # Analyze query
        analysis = rag_system["analyzer"].analyze_query(
            request.query, 
            show_retrieved_content=request.show_content
        )
        
        return analysis
        
    except Exception as e:
        print(f"❌ Error analyzing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error analyzing query: {str(e)}")


@app.post("/rerank-demo")
async def rerank_demonstration(request: QueryRequest):
    """
    Demonstrate the effect of reranking on query results.
    
    Args:
        request: Query request containing the question
    """
    global rag_system
    
    if not rag_system:
        raise HTTPException(status_code=400, detail="No PDF has been uploaded and indexed yet")
    
    try:
        # Run reranking demonstration
        results_df = rag_system["rerank_demo"](request.query, top_k=4)
        
        # Convert DataFrame to dict for JSON response
        return {
            "query": request.query,
            "results": results_df.to_dict('records')
        }
        
    except Exception as e:
        print(f"❌ Error in reranking demo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error in reranking demo: {str(e)}")


@app.get("/preset-queries")
async def get_preset_queries():
    """
    Get a list of preset queries for testing.
    """
    preset_queries = {
        "What is the purpose of this document?": "What is the purpose of this document?",
        "What is the name of the contract?": "What is the name of the contract?",
        "What is the amount of the contract?": "What is the amount of the contract?",
        "What is the term of the contract?": "What is the term of the contract?",
    }
    
    return {"preset_queries": preset_queries}


@app.delete("/reset")
async def reset_system():
    """
    Reset the RAG system by clearing the current index and PDF.
    """
    global rag_system, current_pdf_path
    
    rag_system = None
    current_pdf_path = None
    
    return {"message": "System reset successfully"}


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    """
    return {
        "status": "healthy",
        "system_ready": rag_system is not None,
        "pdf_loaded": current_pdf_path is not None
    }


def main():
    """
    Main function to run the FastAPI application.
    """
    print("🚀 Starting RAG Pipeline API with Groq...")
    print("📁 Upload a PDF file to get started!")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()