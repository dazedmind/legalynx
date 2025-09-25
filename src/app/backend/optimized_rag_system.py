# ================================
# VECTORIZED RAG SYSTEM - HYBRID VECTOR + BM25
# ================================

import os
import re
import time
import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import fitz  # PyMuPDF
import sys
import os
if os.path.dirname(os.path.abspath(__file__)) not in sys.path:
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# ================================
# GLOBAL SINGLETON MODEL MANAGER
# ================================

class GlobalModelManager:
    """
    Singleton pattern to initialize models ONCE and reuse across all uploads.
    Now includes vector embedding capabilities.
    """
    _instance = None
    _embedding_manager = None
    _initialization_lock = asyncio.Lock()
    _is_initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    async def get_embedding_manager(cls):
        """Get the singleton embedding manager, initialize if needed."""
        if not cls._is_initialized:
            async with cls._initialization_lock:
                if not cls._is_initialized:
                    print("🔄 Initializing models with vector embeddings (SINGLETON - ONCE ONLY)...")
                    start_time = time.time()
                    
                    try:
                        # Import here to avoid circular imports
                        from rag_pipeline.embedder import EmbeddingManager
                        
                        # Initialize ONCE
                        cls._embedding_manager = EmbeddingManager()
                        cls._is_initialized = True
                        
                        init_time = time.time() - start_time
                        print(f"✅ Models with vector embeddings initialized in {init_time:.2f}s (will be reused)")
                    except Exception as e:
                        print(f"❌ Failed to initialize embedding manager: {e}")
                        print("🔄 This may be due to PyTorch compatibility issues or missing dependencies")
                        # Don't set _is_initialized to True so we can retry later
                        raise RuntimeError(f"Embedding manager initialization failed: {e}")
        
        if cls._embedding_manager is None:
            raise RuntimeError("Embedding manager is not initialized")
            
        print("⚡ Using cached models with vector embeddings (FAST)")
        return cls._embedding_manager

# Global instance
model_manager = GlobalModelManager()

# ================================
# VECTORIZED RAG SYSTEM BUILDER
# ================================

def create_vectorized_rag_system(documents: List, pdf_path: str) -> Dict[str, Any]:
    """
    Create a vectorized RAG system using hybrid vector + BM25 retrieval.
    """
    print("🔄 Building vectorized RAG system with hybrid retrieval...")
    start_time = time.time()
    
    try:
        from llama_index.core.schema import TextNode, Document
        from llama_index.core.query_engine import RetrieverQueryEngine
        from llama_index.core.postprocessor import SentenceTransformerRerank
        from llama_index.retrievers.bm25 import BM25Retriever
        from llama_index.core.retrievers import BaseRetriever, QueryFusionRetriever
        from llama_index.core import VectorStoreIndex
        from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
        from rag_pipeline.embedder import EmbeddingManager
        from rag_pipeline.pipeline_builder import HybridRetriever
        
        # Convert documents to TextNode format
        nodes = []
        for i, doc in enumerate(documents):
            try:
                if isinstance(doc, dict):
                    content = doc.get('content', str(doc))
                    metadata = doc.get('metadata', {})
                else:
                    content = str(doc)
                    metadata = {}
                
                # Validate content
                content = content.strip()
                if not content or len(content) < 10:
                    continue
                
                # Limit content length
                if len(content) > 2000:
                    content = content[:2000] + "..."
                
                metadata.update({
                    'source': pdf_path,
                    'page': i + 1,
                    'chunk_id': i,
                    'chunk_type': 'fine'  # Set as fine chunks for vector retrieval
                })
                
                node = TextNode(
                    text=content,
                    metadata=metadata
                )
                nodes.append(node)
                
            except Exception as doc_error:
                print(f"⚠️ Failed to process document {i}: {doc_error}")
                continue
        
        if not nodes:
            raise Exception("No valid nodes created from documents")
        
        print(f"📄 Created {len(nodes)} text nodes")
        
        # Get embedding manager
        try:
            embedding_manager = EmbeddingManager()
            print("✅ Embedding manager retrieved successfully")
        except Exception as em_error:
            print(f"❌ Embedding manager retrieval failed: {em_error}")
            raise Exception(f"Could not get embedding manager: {em_error}")
        
        # Create vector index
        try:
            print("🔄 Building vector index...")
            vector_index = VectorStoreIndex(nodes, embed_model=embedding_manager.get_embedding_model())
            print("✅ Vector index created successfully")
        except Exception as vector_error:
            print(f"❌ Vector index creation failed: {vector_error}")
            raise Exception(f"Could not create vector index: {vector_error}")
        
        # Create BM25 retriever
        try:
            bm25_retriever = BM25Retriever.from_defaults(
                nodes=nodes,
                similarity_top_k=min(3, len(nodes))
            )
            print("✅ BM25 retriever created successfully")
        except Exception as bm25_error:
            print(f"❌ BM25 retriever creation failed: {bm25_error}")
            raise Exception(f"Could not create BM25 retriever: {bm25_error}")
        
        # Create vector retriever
        try:
            vector_retriever = vector_index.as_retriever(
                similarity_top_k=min(3, len(nodes))
            )
            print("✅ Vector retriever created successfully")
        except Exception as vector_ret_error:
            print(f"❌ Vector retriever creation failed: {vector_ret_error}")
            raise Exception(f"Could not create vector retriever: {vector_ret_error}")
        
        # Create hybrid retriever
        try:
            hybrid_retriever = HybridRetriever(
                vector_retriever=vector_retriever,
                bm25_retriever=bm25_retriever,
                top_k=min(3, len(nodes))
            )
            print("✅ Hybrid retriever created successfully")
        except Exception as hybrid_error:
            print(f"❌ Hybrid retriever creation failed: {hybrid_error}")
            raise Exception(f"Could not create hybrid retriever: {hybrid_error}")
        
        # Get LLM
        try:
            llm = embedding_manager.get_llm()
            print("✅ LLM retrieved successfully")
        except Exception as llm_error:
            print(f"❌ LLM retrieval failed: {llm_error}")
            raise Exception(f"Could not get LLM: {llm_error}")
        
        # Create query engine with hybrid retrieval
        try:
            query_engine = RetrieverQueryEngine.from_args(
                retriever=hybrid_retriever,
                llm=llm
            )
            print("✅ Vectorized query engine created")
        except Exception as engine_error:
            print(f"❌ Query engine creation failed: {engine_error}")
            raise Exception(f"Could not create query engine: {engine_error}")
        
        # Create performance monitor
        class SimplePerformanceMonitor:
            def __init__(self):
                self.query_count = 0
                
            def log_query(self, query: str, response_time: float):
                self.query_count += 1
                print(f"📊 Query #{self.query_count} completed in {response_time:.2f}s")
        
        performance_monitor = SimplePerformanceMonitor()
        
        # Create analyzer
        def analyze_query_results(query_text: str, top_k: int = 4):
            """Enhanced query analyzer for hybrid retrieval."""
            from llama_index.core.schema import QueryBundle
            
            try:
                query_bundle = QueryBundle(query_str=query_text)
                
                # Get results from individual retrievers
                vector_nodes = vector_retriever.retrieve(query_bundle)
                bm25_nodes = bm25_retriever.retrieve(query_bundle)
                hybrid_nodes = hybrid_retriever._retrieve(query_bundle)
                
                return {
                    "query": query_text,
                    "vector_results": len(vector_nodes),
                    "bm25_results": len(bm25_nodes),
                    "hybrid_results": len(hybrid_nodes),
                    "status": "analyzed"
                }
            except Exception as e:
                return {"query": query_text, "status": f"analysis_failed: {e}"}
        
        build_time = time.time() - start_time
        print(f"✅ Vectorized RAG system built in {build_time:.2f}s")
        
        return {
            "query_engine": query_engine,
            "rerank_demo": analyze_query_results,
            "analyzer": analyze_query_results,
            "pipeline_builder": None,
            "embedding_manager": embedding_manager,
            "performance_monitor": performance_monitor,
            "retrieval_type": "hybrid_vector_bm25",
            "vector_index": vector_index,
            "build_time": build_time
        }
        
    except Exception as e:
        print(f"❌ Vectorized RAG system build failed: {e}")
        raise Exception(f"Vectorized RAG build failed: {e}")

# BM25-only functionality removed as requested

# ================================
# ULTRA-FAST RULE-BASED NAMING (UNCHANGED)
# ================================

class RuleBasedFileNamer:
    """
    Ultra-fast file naming using regex patterns and text analysis.
    NO LLM calls, NO RAG queries - pure pattern matching.
    """
    
    # Pre-compiled regex patterns for speed
    DATE_PATTERNS = [
        re.compile(r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})'),
        re.compile(r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})'),
        re.compile(r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}', re.IGNORECASE),
        re.compile(r'(\d{8})'),  # YYYYMMDD
    ]
    
    PERSON_PATTERNS = [
        re.compile(r'\b([A-Z][a-z]+ [A-Z][a-z]+)\b'),  # First Last
        re.compile(r'\b([A-Z][a-z]+, [A-Z][a-z]+)\b'),  # Last, First
        re.compile(r'borrower:\s*([A-Z][a-z]+ [A-Z][a-z]+)', re.IGNORECASE),
        re.compile(r'mortgagor:\s*([A-Z][a-z]+ [A-Z][a-z]+)', re.IGNORECASE),
        re.compile(r'client:\s*([A-Z][a-z]+ [A-Z][a-z]+)', re.IGNORECASE),
    ]
    
    DOC_TYPE_PATTERNS = {
        'power of attorney': 'PowerOfAttorney',
        'poa': 'PowerOfAttorney',
        'attorney': 'PowerOfAttorney',
        'contract': 'Contract',
        'agreement': 'Agreement',
        'mortgage': 'Mortgage',
        'deed': 'Deed',
        'invoice': 'Invoice',
        'claim': 'Claim',
        'approval': 'Approval',
        'partial approval': 'PartialApproval',
        'certificate': 'Certificate',
        'license': 'License',
        'permit': 'Permit',
        'security': 'Security',
        'instrument': 'Instrument',
        'note': 'Note',
        'loan': 'Loan',
        'title': 'Title',
        'insurance': 'Insurance',
        'bond': 'Bond',
        'warranty': 'Warranty',
        'guarantee': 'Guarantee',
        'resignation': 'ResignationLetter',
        'resignation letter': 'ResignationLetter',
    }

    @staticmethod
    def extract_text_fast(file_content: bytes, max_pages: int = 3) -> str:
        """Extract text from first few pages only for naming analysis."""
        import io
        
        try:
            pdf_stream = io.BytesIO(file_content)
            
            with fitz.open(stream=pdf_stream, filetype="pdf") as doc:
                text_parts = []
                pages_to_process = min(max_pages, len(doc))
                
                for i in range(pages_to_process):
                    page = doc[i]
                    page_text = page.get_text()
                    text_parts.append(page_text)
                
                return '\n'.join(text_parts)
        
        except Exception as e:
            print(f"⚠️ Fast text extraction failed: {e}")
            return ""

    @classmethod
    def extract_date(cls, text: str) -> Optional[str]:
        """Extract date using pre-compiled regex patterns."""
        text_sample = text[:2000]
        
        for pattern in cls.DATE_PATTERNS:
            match = pattern.search(text_sample)
            if match:
                date_str = match.group(1)
                try:
                    if '/' in date_str or '-' in date_str:
                        parts = re.split('[-/]', date_str)
                        if len(parts) == 3:
                            if len(parts[0]) == 4:
                                year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                            elif len(parts[2]) == 4:
                                month, day, year = int(parts[0]), int(parts[1]), int(parts[2])
                            else:
                                continue
                            
                            if 1900 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
                                return f"{year:04d}{month:02d}{day:02d}"
                    
                    elif len(date_str) == 8 and date_str.isdigit():
                        year = int(date_str[:4])
                        month = int(date_str[4:6])
                        day = int(date_str[6:8])
                        if 1900 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
                            return date_str
                
                except (ValueError, IndexError):
                    continue
        
        return None

    @classmethod
    def extract_person(cls, text: str) -> Optional[str]:
        """Extract person name using pre-compiled regex patterns."""
        text_sample = text[:3000]  # Check first 3000 chars
        
        for pattern in cls.PERSON_PATTERNS:
            matches = pattern.findall(text_sample)
            if matches:
                # Use the most common name (might appear multiple times)
                from collections import Counter
                most_common = Counter(matches).most_common(1)
                if most_common:
                    name = most_common[0][0]
                    # Clean and validate
                    cleaned_name = re.sub(r'[^\w\s]', '', name).replace(' ', '').strip()
                    if 4 <= len(cleaned_name) <= 30:  # Reasonable name length
                        return cleaned_name
        
        return None

    @classmethod
    def extract_document_type(cls, text: str, filename: str = "") -> Optional[str]:
        """Extract document type using keyword matching."""
        # Check both text content and filename
        combined_text = (text[:2000] + " " + filename).lower()
        
        for keyword, doc_type in cls.DOC_TYPE_PATTERNS.items():
            if keyword in combined_text:
                return doc_type
        
        return None

    @classmethod
    async def generate_filename_ultra_fast(
        cls,
        file_content: bytes,
        original_filename: str,
        naming_option: str,
        user_title: Optional[str] = None,
        user_client_name: Optional[str] = None,
        counter: Optional[int] = None
    ) -> str:
        """
        LLM-enhanced filename generation with intelligent document analysis.
        Uses LLM to extract document information for accurate naming.
        Format: YYYYMMDD_TITLE.pdf (all caps with dashes)
        """
        if naming_option == "keep_original":
            return original_filename
        
        start_time = time.time()
        file_ext = os.path.splitext(original_filename)[1].lower()
        
        print("🧠 Using LLM for document analysis...")
        
        # Initialize variables to avoid scoping issues
        date_part = datetime.now().strftime("%Y%m%d")
        
        try:
            # Import and use LLM document extractor
            from services.llm_document_extractor import extract_document_info
            
            # Extract document information using LLM
            extracted_info = await extract_document_info(file_content, original_filename)
            
            # Get extracted values with fallbacks
            raw_type = extracted_info.get('document_type') or user_title or 'Document'
            extracted_date = extracted_info.get('date')
            extracted_client = extracted_info.get('client_name')
            
            # Clean the document type for filename safety
            if raw_type:
                print(f"📝 Raw document type from LLM: {raw_type}")
                
                # First, split CamelCase into separate words
                # e.g., "AcknowledgmentOfDebt" -> "Acknowledgment Of Debt"
                camel_split = re.sub(r'(?<!^)(?=[A-Z])', ' ', raw_type)
                print(f"📝 After CamelCase split: {camel_split}")
                
                # Remove special characters
                cleaned_type = re.sub(r'[^\w\s-]', '', camel_split)
                # Replace multiple spaces with single space and strip
                cleaned_type = re.sub(r'\s+', ' ', cleaned_type).strip()
                
                # Filter out unknown words (case-insensitive)
                words_to_remove = ['page', 'unknown', 'document', 'file', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
                words = cleaned_type.split()
                filtered_words = [w for w in words if w.lower() not in words_to_remove and not w.isdigit()]
                
                if filtered_words:
                    # Convert to uppercase and join with dash
                    extracted_type = '-'.join(filtered_words).upper()[:50]
                    print(f"✅ Cleaned document type: {extracted_type}")
                else:
                    # If all words were filtered out, use fallback
                    extracted_type = user_title.upper().replace(' ', '-') if user_title else 'DOCUMENT'
                    print(f"⚠️ All words filtered, using fallback: {extracted_type}")
            else:
                extracted_type = 'DOCUMENT'
            
            # Clean client name similarly
            if extracted_client:
                print(f"📝 Raw client name from LLM: {extracted_client}")

                # CRITICAL FIX: Immediately check for test placeholders before any processing
                test_placeholders = ['testclient', 'test client', 'test-client', 'sample', 'example', 'placeholder']
                if any(placeholder in extracted_client.lower() for placeholder in test_placeholders):
                    print(f"⚠️ Detected test placeholder in LLM response: '{extracted_client}'")
                    print(f"   Using user_client_name fallback instead")
                    extracted_client = None
                    # This will trigger the fallback logic below

                # Only proceed with cleaning if not a test placeholder
                if extracted_client:
                    # CRITICAL FIX: Remove page references and common noise before processing
                    # Handle patterns like "ZAYVEN KORRIN Page 1", "JOHN DOE *[Page 1]*", etc.
                    noise_patterns = [
                        r'\s*\*?\[?\s*page\s+\d+\s*\]?\*?',  # [Page 1], *[Page 1]*, Page 1
                        r'\s*page\s+\d+',                     # Page 1, page 2
                        r'\s*\*\[.*?\]\*',                   # *[any text]*
                        r'\s*\[.*?\]',                       # [any text]
                        r'\s+\d+$'                          # trailing numbers
                    ]

                    cleaned_client = extracted_client
                    for pattern in noise_patterns:
                        cleaned_client = re.sub(pattern, '', cleaned_client, flags=re.IGNORECASE).strip()

                    # Only split CamelCase if it's not already all uppercase or contains mixed case
                    # Avoid splitting normal names like "ZAYVEN KORRIN" which are already properly spaced
                    if not cleaned_client.isupper() and not cleaned_client.islower():
                        # Split CamelCase only for mixed case strings like "JohnDoe"
                        camel_split = re.sub(r'(?<!^)(?=[A-Z][a-z])', ' ', cleaned_client)
                    else:
                        camel_split = cleaned_client

                    cleaned_client = re.sub(r'[^\w\s-]', ' ', camel_split)
                    cleaned_client = re.sub(r'\s+', ' ', cleaned_client).strip()

                    # Enhanced word filtering
                    words_to_remove = [
                        'page', 'unknown', 'document', 'file', 'test', 'client',
                        'testclient', 'sample', 'example', 'placeholder'
                    ]
                    words = cleaned_client.split()

                    # Check for "vs" or "versus" to detect multi-party cases
                    if 'vs' in [w.lower() for w in words] or 'versus' in [w.lower() for w in words]:
                        # Multi-party case: extract surnames from both sides
                        vs_index = -1
                        for i, word in enumerate(words):
                            if word.lower() in ['vs', 'versus', 'v']:
                                vs_index = i
                                break

                        if vs_index > 0 and vs_index < len(words) - 1:
                            # Get words before and after "vs"
                            first_party_words = [w for w in words[:vs_index] if w.lower() not in words_to_remove and not w.isdigit()]
                            second_party_words = [w for w in words[vs_index+1:] if w.lower() not in words_to_remove and not w.isdigit()]

                            # Extract surnames (last word from each party)
                            surnames = []
                            if first_party_words:
                                surnames.append(first_party_words[-1].upper())
                            if second_party_words:
                                surnames.append(second_party_words[-1].upper())

                            if surnames:
                                extracted_client = '-'.join(surnames)[:40]
                                print(f"✅ Extracted multi-party surnames: {extracted_client}")
                            else:
                                print(f"⚠️ Multi-party extraction failed, using user_client_name fallback")
                                extracted_client = None
                        else:
                            # Fallback to single surname
                            filtered_words = [w for w in words if w.lower() not in words_to_remove + ['vs', 'versus', 'v'] and not w.isdigit()]
                            if filtered_words:
                                extracted_client = filtered_words[-1].upper()[:20]
                                print(f"✅ Extracted surname: {extracted_client}")
                            else:
                                print(f"⚠️ All words filtered, using user_client_name fallback")
                                extracted_client = None
                    else:
                        # Single party case: extract last surname only
                        filtered_words = [w for w in words if w.lower() not in words_to_remove and not w.isdigit()]

                        if filtered_words:
                            # Take LAST word (surname) and ensure it's substantial (not just 1 letter)
                            surname = filtered_words[-1].upper()

                            # Validation: surname should be at least 2 characters
                            if len(surname) >= 2:
                                extracted_client = surname[:20]
                                print(f"✅ Extracted surname: {extracted_client}")
                            else:
                                # Try second-to-last word if last word is too short
                                if len(filtered_words) >= 2:
                                    surname = filtered_words[-2].upper()
                                    if len(surname) >= 2:
                                        extracted_client = surname[:20]
                                        print(f"✅ Extracted surname (from 2nd last): {extracted_client}")
                                    else:
                                        print(f"⚠️ Surname too short, using user_client_name fallback")
                                        extracted_client = None
                                else:
                                    print(f"⚠️ Only one short word found, using user_client_name fallback")
                                    extracted_client = None
                        else:
                            print(f"⚠️ No valid words after filtering, using user_client_name fallback")
                            extracted_client = None
            
            # CRITICAL: Final fallback to user_client_name if extraction failed or returned invalid result
            if not extracted_client and user_client_name:
                print(f"📝 Using user_client_name as fallback: {user_client_name}")
                client_words = user_client_name.strip().split()
                
                # Check for multi-party case in user input
                if 'vs' in [w.lower() for w in client_words] or 'versus' in [w.lower() for w in client_words]:
                    vs_index = -1
                    for i, word in enumerate(client_words):
                        if word.lower() in ['vs', 'versus', 'v']:
                            vs_index = i
                            break
                    
                    if vs_index > 0 and vs_index < len(client_words) - 1:
                        surnames = []
                        if client_words[vs_index-1]:
                            surnames.append(client_words[vs_index-1].upper())
                        if vs_index + 1 < len(client_words):
                            surnames.append(client_words[vs_index+1].upper())
                        extracted_client = '-'.join(surnames) if surnames else user_client_name.upper().replace(' ', '-')
                    else:
                        extracted_client = client_words[-1].upper() if client_words else user_client_name.upper().replace(' ', '-')
                else:
                    # Single party: use last word (surname)
                    extracted_client = client_words[-1].upper() if client_words else user_client_name.upper().replace(' ', '-')
                
                print(f"✅ Fallback client name extracted: {extracted_client}")         

            # Parse extracted date if available
            if extracted_date:
                try:
                    # Remove any trailing text like "*[Page 1]*"
                    date_clean = re.sub(r'\s*\*?\[.*?\]\*?', '', extracted_date).strip()
                    
                    # Parse date and format as YYYYMMDD
                    if '-' in date_clean:
                        date_obj = datetime.strptime(date_clean, "%Y-%m-%d")
                        date_part = date_obj.strftime("%Y%m%d")
                        print(f"✅ Extracted date: {date_part}")
                    else:
                        date_part = date_clean[:8] if len(date_clean) >= 8 else datetime.now().strftime("%Y%m%d")
                except Exception as date_err:
                    print(f"⚠️ Date parsing error: {date_err}, using current date")
                    date_part = datetime.now().strftime("%Y%m%d")
            
            # Build filename based on naming option
            if naming_option == "add_timestamp":
                # Format: YYYYMMDD_DOCUMENTTYPE.ext (no client name, uppercase with dashes)
                if not extracted_type or extracted_type == 'DOCUMENT':
                    # Use user title as absolute fallback
                    extracted_type = user_title.upper().replace(' ', '-') if user_title else 'DOCUMENT'
                
                filename = f"{date_part}_{extracted_type}{file_ext}"
                    
            elif naming_option == "add_client_name":
                # Format: YYYYMMDD_DOCUMENTTYPE_SURNAME.ext
                
                # CRITICAL FIX: Properly handle fallback to user_client_name
                if not extracted_client:
                    if user_client_name:
                        print(f"📝 No client extracted from LLM, using user_client_name: {user_client_name}")
                        client_words = user_client_name.strip().split()
                        
                        # Check for multi-party case
                        if 'vs' in [w.lower() for w in client_words] or 'versus' in [w.lower() for w in client_words]:
                            vs_index = -1
                            for i, word in enumerate(client_words):
                                if word.lower() in ['vs', 'versus', 'v']:
                                    vs_index = i
                                    break
                            
                            if vs_index > 0 and vs_index < len(client_words) - 1:
                                surnames = []
                                if client_words[vs_index-1]:
                                    surnames.append(client_words[vs_index-1].upper())
                                if vs_index + 1 < len(client_words):
                                    surnames.append(client_words[vs_index+1].upper())
                                extracted_client = '-'.join(surnames) if surnames else user_client_name.upper().replace(' ', '-')
                                print(f"✅ Multi-party surnames from user_client_name: {extracted_client}")
                            else:
                                extracted_client = client_words[-1].upper() if client_words else user_client_name.upper().replace(' ', '-')
                                print(f"✅ Surname from user_client_name: {extracted_client}")
                        else:
                            # Single party: use last word (surname)
                            extracted_client = client_words[-1].upper() if client_words else user_client_name.upper().replace(' ', '-')
                            print(f"✅ Surname from user_client_name: {extracted_client}")
                    else:
                        # Only use default if absolutely no client information is available
                        extracted_client = "UNKNOWN"
                        print(f"⚠️ No client name available, using: {extracted_client}")
                        
                
                # Ensure document type is set
                if not extracted_type or extracted_type == 'DOCUMENT':
                    extracted_type = user_title.upper().replace(' ', '-') if user_title else 'DOCUMENT'
                
                # CRITICAL: Build filename with client at the END
                # Format: YYYYMMDD_DOCUMENTTYPE_SURNAME.ext
                filename = f"{date_part}_{extracted_type}_{extracted_client}{file_ext}"
                
                print(f"🏗️ Building filename with client name:")
                print(f"   - Date: {date_part}")
                print(f"   - Type: {extracted_type}")
                print(f"   - Client: {extracted_client}")
                print(f"   - Final: {filename}")
            
            else:
                filename = original_filename
            processing_time = time.time() - start_time
            print(f"✅ LLM-enhanced naming completed in {processing_time:.3f}s")
            print(f"   - Document Type: {extracted_info.get('document_type', 'Unknown')}")
            print(f"   - Date: {extracted_date}")
            print(f"   - Client Surname: {extracted_client or 'None'}")
            print(f"   - Final: {filename}")
            
            return filename
            
        except Exception as e:
            # This exception handler starts here - make sure it's properly aligned
            print(f"⚠️ LLM extraction failed, using fallback: {e}")
            import traceback
            print(f"   Traceback: {traceback.format_exc()}")
            
            # Use fallback document type if LLM extraction failed
            fallback_type = user_title or "Document"
            fallback_type = re.sub(r'[^\w\s-]', '', fallback_type)
            fallback_type = re.sub(r'\s+', '-', fallback_type).upper()[:20]
            
            # Build filename using fallback logic
            if naming_option == "add_timestamp":
                filename = f"{date_part}_{fallback_type}{file_ext}"
            elif naming_option == "add_client_name":
                # Extract surname from user_client_name for fallback
                if user_client_name:
                    client_words = user_client_name.strip().split()
                    client_part = client_words[-1].upper() if client_words else "CLIENT"
                else:
                    client_part = "CLIENT"
                # Format: YYYYMMDD_DOCUMENTTYPE_SURNAME.ext
                filename = f"{date_part}_{fallback_type}_{client_part}{file_ext}"
            else:
                filename = original_filename
            
            processing_time = time.time() - start_time
            print(f"⚡ Fallback naming completed in {processing_time:.3f}s")
            print(f"   - Final: {filename}")
            
            return filename

    @staticmethod
    def _extract_name_from_filename(filename: str) -> Optional[str]:
        """Extract name from original filename as fallback."""
        base_name = os.path.splitext(filename)[0]
        name_match = re.search(r'([A-Z][a-z]+ [A-Z][a-z]+)', base_name)
        if name_match:
            return name_match.group(1).replace(' ', '')
        return None

    @staticmethod
    def _extract_type_from_filename(filename: str) -> Optional[str]:
        """Extract document type from original filename as fallback."""
        base_name = os.path.splitext(filename)[0].lower()
        
        type_map = {
            'power': 'PowerOfAttorney',
            'attorney': 'PowerOfAttorney',
            'poa': 'PowerOfAttorney',
            'contract': 'Contract',
            'agreement': 'Agreement',
            'mortgage': 'Mortgage',
            'deed': 'Deed',
            'invoice': 'Invoice',
            'claim': 'Claim',
            'approval': 'Approval',
            'certificate': 'Certificate',
            'resignation': 'ResignationLetter',
        }
        
        for keyword, doc_type in type_map.items():
            if keyword in base_name:
                return doc_type
        return None

# ================================
# VECTORIZED RAG SYSTEM BUILDER
# ================================

class VectorizedRAGBuilder:
    """
    Vectorized RAG system that builds using hybrid vector + BM25 retrieval.
    Uses singleton model manager to avoid re-initialization.
    """
    
    @staticmethod
    async def build_rag_system_fast(documents: List, pdf_path: str) -> Dict[str, Any]:
        """
        Build vectorized RAG system using cached models.
        """
        print("🚀 Building vectorized RAG system with optimizations...")
        start_time = time.time()
        
        # Get cached embedding manager (singleton)
        try:
            embedding_manager = await model_manager.get_embedding_manager()
            print("✅ Using cached embedding manager")
        except Exception as e:
            print(f"⚠️ Could not get embedding manager: {e}")
            # Continue without it for now
        
        # Run in background thread to avoid blocking
        loop = asyncio.get_event_loop()
        executor = ThreadPoolExecutor(max_workers=1)
        
        try:
            # Build vectorized RAG system
            rag_system = await loop.run_in_executor(
                executor,
                lambda: create_vectorized_rag_system(documents, pdf_path)
            )
            
            if not rag_system or "query_engine" not in rag_system:
                raise Exception("Vectorized RAG system build failed - no query engine")
            
            build_time = time.time() - start_time
            print(f"✅ RAG system built in {build_time:.2f}s")
            
            return rag_system
            
        except Exception as e:
            print(f"❌ RAG system build failed: {e}")
            raise
        finally:
            executor.shutdown(wait=False)

# ================================
# ULTRA-FAST CONFIGURATION (UNCHANGED)
# ================================

ULTRA_FAST_CONFIG = {
    "fine_chunk_size": 512,
    "fine_chunk_overlap": 50,
    "coarse_chunk_size": 1024,
    "retrieval_top_k": 3,
    "rerank_top_n": 2,
    "num_query_expansions": 1,
    "enable_logical_chunking": False,
    "enable_hybrid_retrieval": True,  # Now enabled for vector + BM25
    "disable_reranking": False,
    "fast_mode": True,
    "bm25_similarity_top_k": 3,
}

def apply_ultra_fast_config():
    """Apply ultra-fast configuration globally."""
    try:
        from rag_pipeline.config import rag_config
        rag_config.update(ULTRA_FAST_CONFIG)
    except ImportError:
        print("⚠️ Could not import rag_config, using defaults")

# ================================
# OPTIMIZED UPLOAD WORKFLOW - VECTORIZED
# ================================

async def optimized_upload_workflow(
    file_content: bytes,
    original_filename: str,
    naming_option: str,
    user_title: Optional[str] = None,
    user_client_name: Optional[str] = None,
    counter: Optional[int] = None
) -> Dict[str, Any]:
    """
    Vectorized optimized upload workflow:
    1. Ultra-fast rule-based naming (no LLM)
    2. Save file immediately
    3. Build vectorized RAG system with cached models
    """
    total_start_time = time.time()
    
    try:
        # STEP 1: LLM-enhanced naming
        print("🧠 Step 1: LLM-enhanced intelligent naming...")
        naming_start = time.time()
        
        intelligent_filename = await RuleBasedFileNamer.generate_filename_ultra_fast(
            file_content=file_content,
            original_filename=original_filename,
            naming_option=naming_option,
            user_title=user_title,
            user_client_name=user_client_name,
            counter=counter
        )
        
        naming_time = time.time() - naming_start
        
        # STEP 2: Save file immediately
        print("💾 Step 2: Saving file...")
        save_start = time.time()
        
        os.makedirs("sample_docs", exist_ok=True)
        file_path = os.path.join("sample_docs", intelligent_filename)
        
        # Handle conflicts
        if os.path.exists(file_path):
            base_name, ext = os.path.splitext(intelligent_filename)
            conflict_counter = 1
            while os.path.exists(file_path):
                file_path = os.path.join("sample_docs", f"{base_name}_{conflict_counter}{ext}")
                conflict_counter += 1
            intelligent_filename = os.path.basename(file_path)
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        save_time = time.time() - save_start
        
        # STEP 3: Process for vectorized RAG
        print("🔄 Step 3: Processing for vectorized RAG...")
        rag_start = time.time()
        
        try:
            from utils.file_handler import extract_text_from_pdf, validate_pdf_content
        except ImportError:
            # Try alternative import path
            import importlib.util
            import sys
            
            file_handler_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'utils', 'file_handler.py')
            if os.path.exists(file_handler_path):
                spec = importlib.util.spec_from_file_location("file_handler", file_handler_path)
                file_handler = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(file_handler)
                
                extract_text_from_pdf = file_handler.extract_text_from_pdf
                validate_pdf_content = file_handler.validate_pdf_content
            else:
                raise ImportError("Cannot find utils.file_handler module")        
        
        validation = validate_pdf_content(file_path)
        if not validation.get("is_valid", False):
            raise Exception("Invalid PDF content")
        
        documents = extract_text_from_pdf(file_path)
        if not documents:
            raise Exception("No text extracted from PDF")
        
        print(f"📄 Extracted {len(documents)} document chunks")
        
        # Build vectorized RAG system
        rag_system = await VectorizedRAGBuilder.build_rag_system_fast(documents, file_path)
        
        if not rag_system or "query_engine" not in rag_system:
            raise Exception("Vectorized RAG system build completed but query engine is missing")
        
        rag_time = time.time() - rag_start
        total_time = time.time() - total_start_time
        
        print(f"🎉 VECTORIZED WORKFLOW COMPLETED in {total_time:.2f}s:")
        print(f"   - Naming: {naming_time:.3f}s (rule-based)")
        print(f"   - File Save: {save_time:.3f}s")
        print(f"   - RAG Build: {rag_time:.2f}s (vectorized)")
        print(f"   - Retrieval Type: {rag_system.get('retrieval_type', 'unknown')}")
        print(f"   - Total Speedup: ~{300/total_time:.1f}x faster")
        
        return {
            "file_path": file_path,
            "filename": intelligent_filename,
            "rag_system": rag_system,
            "documents": documents,
            "timing": {
                "naming": naming_time,
                "save": save_time, 
                "rag": rag_time,
                "total": total_time
            }
        }
        
    except Exception as e:
        print(f"❌ Vectorized RAG processing failed: {e}")
        # Clean up the saved file on failure
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"🗑️ Cleaned up file: {file_path}")
            except:
                pass
        raise

# ================================
# INITIALIZATION
# ================================

# Apply ultra-fast config on import
apply_ultra_fast_config()
