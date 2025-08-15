"""
LLM-based Document Information Extraction Service

This service uses LLM to intelligently extract document information
instead of relying on regex patterns for filename generation.
"""

import time
import os
from typing import Dict, Any, Optional, Union
import fitz  # PyMuPDF for fast text extraction
from datetime import datetime

# Import the embedding manager to get LLM instance
try:
    from rag_pipeline.embedder import EmbeddingManager
except ImportError:
    print("⚠️ Warning: Could not import EmbeddingManager")
    EmbeddingManager = None


class LLMDocumentExtractor:
    """
    LLM-based document information extractor for intelligent filename generation.
    Replaces regex-based extraction with LLM analysis.
    """
    
    def __init__(self):
        self.llm = None
        self._initialize_llm()
    
    def _initialize_llm(self):
        """Initialize the LLM instance."""
        try:
            if EmbeddingManager:
                embedding_manager = EmbeddingManager()
                self.llm = embedding_manager.get_llm()
                print("✅ LLM initialized for document extraction")
            else:
                print("⚠️ EmbeddingManager not available, LLM extraction disabled")
        except Exception as e:
            print(f"⚠️ Failed to initialize LLM for extraction: {e}")
            self.llm = None
    
    def extract_text_from_content(self, file_content: Union[bytes, str], max_pages: int = 3) -> str:
        """Extract text from file content (bytes or file path)."""
        try:
            if isinstance(file_content, str):
                # It's a file path
                doc = fitz.open(file_content)
            else:
                # It's bytes content
                doc = fitz.open(stream=file_content, filetype="pdf")
            
            text_parts = []
            max_pages = min(max_pages, len(doc))
            
            for page_num in range(max_pages):
                page = doc[page_num]
                text_parts.append(page.get_text())
            
            doc.close()
            return "\n".join(text_parts)
            
        except Exception as e:
            print(f"⚠️ Text extraction failed: {e}")
            return ""
    
    async def extract_document_info(
        self, 
        file_content: Union[bytes, str], 
        original_filename: str
    ) -> Dict[str, Any]:
        """
        Extract document information using LLM analysis.
        
        Args:
            file_content: File content as bytes or file path as string
            original_filename: Original filename for context
            
        Returns:
            Dict with extracted information: document_type, title, date, etc.
        """
        start_time = time.time()
        
        if not self.llm:
            print("⚠️ LLM not available, using fallback extraction")
            return self._fallback_extraction(original_filename)
        
        try:
            # Extract text from document
            text_content = self.extract_text_from_content(file_content)
            
            if not text_content.strip():
                print("⚠️ No text extracted from document")
                return self._fallback_extraction(original_filename)
            
            # Truncate text if too long (keep first 2000 characters for efficiency)
            if len(text_content) > 2000:
                text_content = text_content[:2000] + "..."
            
            # Create LLM prompt for document analysis
            prompt = self._create_extraction_prompt(text_content, original_filename)
            
            # Get LLM response
            print("🧠 Analyzing document with LLM...")
            response = await self.llm.acomplete(prompt)
            response_text = str(response).strip()
            
            # Parse LLM response
            extracted_info = self._parse_llm_response(response_text, original_filename)
            
            processing_time = time.time() - start_time
            extracted_info["processing_time"] = processing_time
            extracted_info["method"] = "llm_extraction"
            
            print(f"✅ LLM extraction completed in {processing_time:.3f}s")
            print(f"   - Document Type: {extracted_info.get('document_type', 'Unknown')}")
            print(f"   - Date: {extracted_info.get('date', 'None')}")
            print(f"   - Client Name: {extracted_info.get('client_name', 'None')}")
            
            return extracted_info
            
        except Exception as e:
            print(f"❌ LLM extraction failed: {e}")
            processing_time = time.time() - start_time
            fallback_info = self._fallback_extraction(original_filename)
            fallback_info["processing_time"] = processing_time
            fallback_info["method"] = "fallback_extraction"
            return fallback_info
    
    def _create_extraction_prompt(self, text_content: str, original_filename: str) -> str:
        """Create a prompt for LLM to extract document information."""
        return f"""
Analyze this document text and extract key information for filename generation.

DOCUMENT TEXT:
{text_content}

ORIGINAL FILENAME: {original_filename}

Please extract the following information and respond in this EXACT format:

DOCUMENT_TYPE: [Type of document - be specific but concise, e.g., "PowerOfAttorney", "Contract", "Invoice", "Letter", etc.]
DATE: [Any date found in the document in YYYY-MM-DD format, or "NONE" if no date found]
CLIENT_NAME: [The name of the client or the person who filed the document or company mentioned in the document, or "NONE" if not found]

RULES:
1. DOCUMENT_TYPE should be specific and professional but concise (max 20 characters)
2. CLIENT_NAME should be the name of the client or the person who filed the document or company mentioned in the document, or "NONE" if not found
2. Use CamelCase for DOCUMENT_TYPE (e.g., "PowerOfAttorney", "ServiceAgreement", "TaxDocument")
3. If multiple dates exist, use the most relevant one (document date, not future dates)
4. Use "NONE" if you cannot determine any field with confidence
5. Keep DOCUMENT_TYPE short and focused on the main document category

Example response:
DOCUMENT_TYPE: PowerOfAttorney
DATE: 2024-03-15
CLIENT_NAME: John Doe
"""
    
    def _parse_llm_response(self, response_text: str, original_filename: str) -> Dict[str, Any]:
        """Parse LLM response to extract structured information."""
        extracted_info = {
            "document_type": None,
            "date": None,
            "client_name": None,
            "confidence": 0.8
        }
        
        try:
            lines = response_text.split('\n')
            
            for line in lines:
                line = line.strip()
                if line.startswith('DOCUMENT_TYPE:'):
                    doc_type = line.replace('DOCUMENT_TYPE:', '').strip()
                    if doc_type and doc_type != "NONE":
                        extracted_info["document_type"] = doc_type
                
                elif line.startswith('DATE:'):
                    date_str = line.replace('DATE:', '').strip()
                    if date_str and date_str != "NONE":
                        extracted_info["date"] = date_str
                
                elif line.startswith('CLIENT_NAME:'):
                    client_name = line.replace('CLIENT_NAME:', '').strip()
                    if client_name and client_name != "NONE":
                        extracted_info["client_name"] = client_name
            
            # Clean up extracted values
            if extracted_info["document_type"]:
                extracted_info["document_type"] = self._clean_text_for_filename(extracted_info["document_type"])
            
            if extracted_info["client_name"]:
                extracted_info["client_name"] = self._clean_text_for_filename(extracted_info["client_name"])
            
            return extracted_info
            
        except Exception as e:
            print(f"⚠️ Failed to parse LLM response: {e}")
            return self._fallback_extraction(original_filename)
    
    def _fallback_extraction(self, original_filename: str) -> Dict[str, Any]:
        """Fallback extraction when LLM is not available."""        
        return {
            "document_type": "Document",
            "date": None,
            "client_name": None,
            "confidence": 0.3,
            "method": "fallback_extraction"
        }
    
    def _clean_text_for_filename(self, text: str) -> str:
        """Clean text to be safe for filenames."""
        import re
        
        # Remove special characters and limit length
        cleaned = re.sub(r'[^\w\s-]', '', text)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # Limit length
        if len(cleaned) > 50:
            cleaned = cleaned[:50].strip()
        
        return cleaned


# Global instance
_extractor_instance = None

def get_document_extractor() -> LLMDocumentExtractor:
    """Get singleton instance of document extractor."""
    global _extractor_instance
    if _extractor_instance is None:
        _extractor_instance = LLMDocumentExtractor()
    return _extractor_instance


async def extract_document_info(
    file_content: Union[bytes, str], 
    original_filename: str
) -> Dict[str, Any]:
    """
    Convenience function to extract document information using LLM.
    
    Args:
        file_content: File content as bytes or file path as string
        original_filename: Original filename for context
        
    Returns:
        Dict with extracted information
    """
    extractor = get_document_extractor()
    return await extractor.extract_document_info(file_content, original_filename)
