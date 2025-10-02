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

# Note: We don't need pymupdf.extra.page_count since we use len(doc) directly
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
# BACKGROUND RAG BUILDER
# ================================

class BackgroundRAGTracker:
    """Track RAG building status for documents."""
    processing_status: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def set_processing(cls, document_id: str):
        """Mark document as processing."""
        cls.processing_status[document_id] = {
            "status": "processing",
            "started_at": time.time(),
            "stage": "initializing"
        }

    @classmethod
    def update_stage(cls, document_id: str, stage: str):
        """Update processing stage."""
        if document_id in cls.processing_status:
            cls.processing_status[document_id]["stage"] = stage

    @classmethod
    def set_ready(cls, document_id: str, rag_system: Dict[str, Any]):
        """Mark document as ready."""
        if document_id in cls.processing_status:
            started_at = cls.processing_status[document_id].get("started_at", time.time())
            cls.processing_status[document_id] = {
                "status": "ready",
                "completed_at": time.time(),
                "processing_time": time.time() - started_at,
                "rag_system": rag_system
            }

    @classmethod
    def set_error(cls, document_id: str, error: str):
        """Mark document as failed."""
        cls.processing_status[document_id] = {
            "status": "error",
            "error": error,
            "failed_at": time.time()
        }

    @classmethod
    def get_status(cls, document_id: str) -> Dict[str, Any]:
        """Get status for a document."""
        return cls.processing_status.get(document_id, {"status": "unknown"})

    @classmethod
    def is_ready(cls, document_id: str) -> bool:
        """Check if RAG is ready."""
        status = cls.get_status(document_id)
        return status.get("status") == "ready"

    @classmethod
    def get_rag_system(cls, document_id: str) -> Optional[Dict[str, Any]]:
        """Get RAG system if ready."""
        status = cls.get_status(document_id)
        if status.get("status") == "ready":
            return status.get("rag_system")
        return None

# ================================
# VECTORIZED RAG SYSTEM BUILDER
# ================================

def create_vectorized_rag_system(documents: List, pdf_path: str, total_pages: int = None) -> Dict[str, Any]:
    """
    Create a vectorized RAG system using hybrid vector + BM25 retrieval.
    """
    start_time = time.time()

    try:
        from llama_index.core.schema import TextNode, Document
        from llama_index.core.query_engine import RetrieverQueryEngine
        from llama_index.core.postprocessor import SentenceTransformerRerank
        from llama_index.retrievers.bm25 import BM25Retriever
        from llama_index.core.retrievers import BaseRetriever, QueryFusionRetriever
        from llama_index.core import VectorStoreIndex, StorageContext
        from llama_index.vector_stores.faiss import FaissVectorStore
        import faiss
        from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
        from rag_pipeline.embedder import EmbeddingManager
        from rag_pipeline.pipeline_builder import EnhancedHybridRetriever
        from rag_pipeline.chunking import multi_granularity_chunking
        
        if total_pages is None:
            import fitz
            with fitz.open(pdf_path) as doc:
                total_pages = len(doc)
                print(f"Detected {total_pages} pages in the document")
        else:
            print(f"Using provided total count: {total_pages}")

        # Ensure documents are Document objects
        doc_objects = []
        for i, doc in enumerate(documents):
            if isinstance(doc, Document):
                doc_objects.append(doc)
            elif isinstance(doc, dict):
                content = doc.get('content', str(doc))
                metadata = doc.get('metadata', {})
                metadata['source'] = pdf_path
                doc_objects.append(Document(text=content, metadata=metadata))
            else:
                doc_objects.append(Document(
                    text=str(doc),
                    metadata={'source': pdf_path, 'page_number': i + 1}
                ))

        # Create three-granularity chunks (small, medium, large)
        nodes = multi_granularity_chunking(doc_objects, pdf_path)

        if not nodes:
            raise Exception("No valid nodes created from multi-granularity chunking")

        # Get embedding manager
        embedding_manager = EmbeddingManager()

        # Create FAISS vector index
        embed_model = embedding_manager.get_embedding_model()
        test_embedding = embed_model.get_text_embedding("test")
        dimension = len(test_embedding)

        faiss_index = faiss.IndexFlatL2(dimension)
        vector_store = FaissVectorStore(faiss_index=faiss_index)
        storage_context = StorageContext.from_defaults(vector_store=vector_store)
        vector_index = VectorStoreIndex(nodes, storage_context=storage_context, embed_model=embed_model)

        print(f"   ✅ Vector index ready ({len(nodes)} nodes, {dimension}D embeddings)")
        
        # Get config values
        from rag_pipeline.config import rag_config
        retrieval_top_k = rag_config["retrieval_top_k"]
        safe_top_k = min(retrieval_top_k, len(nodes))

        # Create retrievers
        bm25_retriever = BM25Retriever.from_defaults(
            nodes=nodes,
            similarity_top_k=safe_top_k
        )
        vector_retriever = vector_index.as_retriever(similarity_top_k=safe_top_k)
        hybrid_retriever = EnhancedHybridRetriever(
            vector_retriever=vector_retriever,
            bm25_retriever=bm25_retriever,
            top_k=safe_top_k
        )

        print(f"   ✅ Hybrid retriever ready (Vector + BM25, top_k={safe_top_k})")

        # Create query engine
        llm = embedding_manager.get_llm()
        query_engine = RetrieverQueryEngine.from_args(
            retriever=hybrid_retriever,
            llm=llm
        )
        
        # Create performance monitor
        class SimplePerformanceMonitor:
            def __init__(self):
                self.query_count = 0
                
            def log_query(self, query: str, response_time: float):
                self.query_count += 1
                print(f"📊 Query #{self.query_count} completed in {response_time:.2f}s")
        
        performance_monitor = SimplePerformanceMonitor()
        
        # Create analyzer
        def run_query_with_reranking(query_text, top_k=8):  # Show more results
            """
            Analyze query results showing original retrieval and after reranking.
            """
            from llama_index.core.schema import QueryBundle
            import pandas as pd
            
            try:
                query_bundle = QueryBundle(query_str=query_text)
                nodes = hybrid_retriever._retrieve(query_bundle)
                
                # Create reranker if we have enough nodes
                reranker = None
                if len(nodes) > 1:
                    try:
                        reranker = SentenceTransformerRerank(
                            model="cross-encoder/ms-marco-electra-base",
                            top_n=min(8, len(nodes))
                        )
                    except:
                        pass
                
                reranked_nodes = reranker.postprocess_nodes(nodes, query_str=query_text) if reranker else nodes

                results = []

                # Original retrieval results
                for i, node in enumerate(nodes[:top_k]):  # Show more nodes
                    results.append({
                        "Stage": "Original Retrieval",
                        "Rank": i + 1,
                        "Score": getattr(node, 'score', 0),
                        "Content": node.get_text()[:200] + "...",  # Show more content
                        "Page": node.metadata.get("page_number", "Unknown"),
                        "Type": node.metadata.get("chunk_type", "Unknown")
                    })

                # After reranking results
                for i, node in enumerate(reranked_nodes[:top_k]):
                    results.append({
                        "Stage": "After Reranking",
                        "Rank": i + 1,
                        "Score": getattr(node, 'score', 0),
                        "Content": node.get_text()[:200] + "...",  # Show more content
                        "Page": node.metadata.get("page_number", "Unknown"),
                        "Type": node.metadata.get("chunk_type", "Unknown")
                    })

                results_df = pd.DataFrame(results)
                return results_df
                
            except Exception as e:
                print(f"⚠️ Query analysis failed: {e}")
                return pd.DataFrame([{"Stage": "Error", "Rank": 1, "Score": 0, "Content": f"Analysis failed: {e}", "Page": "Unknown", "Type": "Error"}])

        build_time = time.time() - start_time
        print(f"   ✅ Query engine ready ({build_time:.2f}s)")

        return {
            "query_engine": query_engine,
            "rerank_demo": run_query_with_reranking,
            "analyzer": run_query_with_reranking,
            "pipeline_builder": None,
            "embedding_manager": embedding_manager,
            "performance_monitor": performance_monitor,
            "retrieval_type": "hybrid_vector_bm25",
            "vector_index": vector_index,
            "nodes": nodes,
            "total_pages": total_pages,
            "build_time": build_time
        }

    except Exception as e:
        print(f"   ❌ RAG system build failed: {e}")
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

                # Simple processing: just clean and format
                # Remove special characters but keep spaces
                cleaned_type = re.sub(r'[^\w\s-]', '', raw_type)
                # Replace multiple spaces with single space and strip
                cleaned_type = re.sub(r'\s+', ' ', cleaned_type).strip()

                # Remove noise words
                words_to_remove = ['page', 'unknown', 'file', 'sample', 'test', 'example']
                words = cleaned_type.split()
                filtered_words = [w for w in words if w.lower() not in words_to_remove and not w.isdigit()]

                if filtered_words:
                    # Convert to uppercase and join with hyphens
                    extracted_type = '-'.join(filtered_words).upper()

                    # CRITICAL: Detect and fix broken text (single letters separated by hyphens)
                    # e.g., "S-A-M-P-L-E" or "U-N-C-A-T-E-G-O-R-I-Z-E-D"
                    parts = extracted_type.split('-')
                    single_letter_count = sum(1 for p in parts if len(p) == 1)

                    # If more than 50% are single letters, it's broken - use fallback
                    if len(parts) > 3 and single_letter_count / len(parts) > 0.5:
                        print(f"⚠️ Detected broken text: {extracted_type}, using fallback")
                        extracted_type = user_title.upper().replace(' ', '-') if user_title else 'DOCUMENT'
                    else:
                        # Remove duplicate consecutive words (e.g., "ACKNOWLEDGMENT-OF-DEBT-ACKNOWLEDGMENT-OF-DEBT")
                        # Split into words and track what we've seen recently
                        final_parts = []
                        for i, part in enumerate(parts):
                            # Check if this part + next few parts form a duplicate of previous parts
                            is_duplicate = False
                            if i > 0 and len(final_parts) >= 3:
                                # Check if current position starts repeating the pattern
                                pattern_len = min(3, len(final_parts))
                                if parts[i:i+pattern_len] == final_parts[-pattern_len:]:
                                    is_duplicate = True

                            if not is_duplicate:
                                final_parts.append(part)

                        extracted_type = '-'.join(final_parts)

                        # CRITICAL: Limit to max 4 words for conciseness
                        # "COMMENT-ON-THE-FORMAL-OFFER-OF-EXHIBITS" -> "COMMENT-ON-FORMAL-OFFER"
                        if len(final_parts) > 4:
                            # Keep first 4 meaningful parts
                            extracted_type = '-'.join(final_parts[:4])
                            print(f"⚠️ Truncated long type to 4 words: {extracted_type}")

                        # Final length limit
                        extracted_type = extracted_type[:50]

                    print(f"✅ Cleaned document type: {extracted_type}")
                else:
                    # If all words were filtered out, use fallback
                    extracted_type = user_title.upper().replace(' ', '-') if user_title else 'DOCUMENT'
                    print(f"⚠️ All words filtered, using fallback: {extracted_type}")
            else:
                extracted_type = 'DOCUMENT'
            
            # Clean client name - extract surnames only, handle multiple parties
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
                    # CRITICAL VALIDATION: If multiple words exist without "vs", reject it
                    # This prevents extracting both client and notary
                    temp_words = extracted_client.strip().split()
                    has_vs = any(w.lower() in ['vs', 'versus', 'v'] for w in temp_words)

                    # If more than 2 words and no "vs", likely includes notary/witness - reject
                    if len(temp_words) > 2 and not has_vs:
                        print(f"⚠️ Detected multiple names without 'vs': '{extracted_client}'")
                        print(f"   This likely includes notary/witnesses - using first surname only")
                        # Extract just the first surname
                        extracted_client = temp_words[0]

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

                    # CRITICAL: ONLY treat as multi-party if "vs" separator exists
                    # Otherwise, LLM might include notary/witnesses which we don't want
                    has_vs_separator = any(w.lower() in ['vs', 'versus', 'v'] for w in words)

                    if has_vs_separator:
                        # Multi-party case: extract surnames from ALL parties
                        # Example: "GUTIERREZ vs GOMEZ vs SUPETRAN" -> "GUTIERREZ-GOMEZ-SUPETRAN"

                        # Split by vs/versus/v separators
                        parties = []
                        current_party = []

                        for word in words:
                            if word.lower() in ['vs', 'versus', 'v']:
                                if current_party:
                                    # Filter and get surname (last word) from current party
                                    party_words = [w for w in current_party if w.lower() not in words_to_remove and not w.isdigit()]
                                    if party_words:
                                        parties.append(party_words[-1].upper())  # Last word = surname
                                    current_party = []
                            else:
                                current_party.append(word)

                        # Don't forget the last party
                        if current_party:
                            party_words = [w for w in current_party if w.lower() not in words_to_remove and not w.isdigit()]
                            if party_words:
                                parties.append(party_words[-1].upper())

                        if parties:
                            extracted_client = '-'.join(parties)[:50]  # Join all surnames with hyphens
                            print(f"✅ Extracted multi-party surnames ({len(parties)} parties): {extracted_client}")
                        else:
                            print(f"⚠️ Multi-party extraction failed, using user_client_name fallback")
                            extracted_client = None
                    else:
                        # Single party case: extract LAST surname only
                        # Special handling for "y" (Spanish "and") - extract word AFTER "y"
                        filtered_words = [w for w in words if w.lower() not in words_to_remove and not w.isdigit()]

                        if filtered_words:
                            # Check for "y" connector (Spanish "and" used in surnames)
                            # Example: "TORRES y YAMBAO" should extract "YAMBAO" (word after "y")
                            y_indices = [i for i, w in enumerate(filtered_words) if w.lower() == 'y']

                            if y_indices:
                                # Take word AFTER the last "y"
                                last_y_index = y_indices[-1]
                                if last_y_index + 1 < len(filtered_words):
                                    surname = filtered_words[last_y_index + 1].upper()
                                    if len(surname) >= 2:
                                        extracted_client = surname[:20]
                                        print(f"✅ Extracted surname (after 'y'): {extracted_client}")
                                    else:
                                        print(f"⚠️ Surname after 'y' too short, using user_client_name fallback")
                                        extracted_client = None
                                else:
                                    # "y" is last word, use word before it
                                    surname = filtered_words[last_y_index - 1].upper() if last_y_index > 0 else filtered_words[0].upper()
                                    if len(surname) >= 2:
                                        extracted_client = surname[:20]
                                        print(f"✅ Extracted surname (before 'y'): {extracted_client}")
                                    else:
                                        print(f"⚠️ Surname too short, using user_client_name fallback")
                                        extracted_client = None
                            else:
                                # No "y" connector: Take LAST word (primary surname)
                                # This handles: "RAMOS BAUTISTA" -> "BAUTISTA" is likely notary, but we'll take LAST
                                # Changed from FIRST to LAST based on Philippine naming conventions
                                surname = filtered_words[-1].upper()

                                # Validation: surname should be at least 2 characters
                                if len(surname) >= 2:
                                    extracted_client = surname[:20]
                                    print(f"✅ Extracted surname (last word): {extracted_client}")
                                else:
                                    # Try second-to-last word if last word is too short
                                    if len(filtered_words) >= 2:
                                        surname = filtered_words[-2].upper()
                                        if len(surname) >= 2:
                                            extracted_client = surname[:20]
                                            print(f"✅ Extracted surname (2nd to last): {extracted_client}")
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
                    print(f"📅 Raw date from LLM: {extracted_date}")
                    # Remove any markdown formatting, asterisks, brackets, and trailing text
                    date_clean = re.sub(r'\s*\*?\[.*?\]\*?', '', extracted_date).strip()
                    # Remove all asterisks (markdown bold markers)
                    date_clean = date_clean.replace('*', '').strip()

                    # Try multiple date formats
                    date_obj = None
                    date_format_used = None
                    date_formats = [
                        ("%Y-%m-%d", "full"),           # 2024-08-20
                        ("%Y/%m/%d", "full"),           # 2024/08/20
                        ("%m/%d/%Y", "full"),           # 08/20/2024
                        ("%m-%d-%Y", "full"),           # 08-20-2024
                        ("%d/%m/%Y", "full"),           # 20/08/2024
                        ("%B %d, %Y", "full"),          # August 20, 2024
                        ("%d %B %Y", "full"),           # 20 August 2024
                        ("%b %d, %Y", "full"),          # Aug 20, 2024
                        ("%d %b %Y", "full"),           # 20 Aug 2024
                        ("%Y%m%d", "full"),             # 20240820
                        ("%Y-%m", "month"),             # 2024-08 (month precision)
                        ("%Y/%m", "month"),             # 2024/08
                        ("%B %Y", "month"),             # August 2024
                        ("%b %Y", "month"),             # Aug 2024
                        ("%Y", "year"),                 # 2024 (year only)
                    ]

                    for fmt, precision in date_formats:
                        try:
                            date_obj = datetime.strptime(date_clean, fmt)
                            date_format_used = precision
                            break
                        except ValueError:
                            continue

                    if date_obj:
                        if date_format_used == "full":
                            date_part = date_obj.strftime("%Y%m%d")
                            print(f"✅ Parsed full date: {date_part}")
                        elif date_format_used == "month":
                            # Month precision: YYYYMM00
                            date_part = date_obj.strftime("%Y%m") + "00"
                            print(f"✅ Parsed month: {date_part}")
                        elif date_format_used == "year":
                            # Year precision: YYYY0000
                            date_part = date_obj.strftime("%Y") + "0000"
                            print(f"✅ Parsed year: {date_part}")
                    else:
                        # Try to extract just year if full date parsing fails
                        year_match = re.search(r'\b(19|20)\d{2}\b', date_clean)
                        if year_match:
                            year = year_match.group()
                            date_part = f"{year}0000"  # Year with unknown month/day
                            print(f"✅ Extracted year only: {date_part}")
                        else:
                            # Fallback to upload date if extraction failed
                            print(f"⚠️ Could not parse date '{date_clean}', using upload date: {date_part}")

                except Exception as date_err:
                    print(f"⚠️ Date parsing error: {date_err}, using upload date: {date_part}")
            
            # CRITICAL: Decide which document type to use
            # Priority: valid user_title > LLM-extracted type > default
            final_type = None

            if user_title:
                # Validate that user_title is not just a sanitized filename
                cleaned_title = user_title.strip()

                # Normalize both user_title and original_filename for comparison
                # Remove all non-alphanumeric chars and convert to lowercase
                normalized_title = re.sub(r'[^a-zA-Z0-9]', '', cleaned_title).lower()
                normalized_filename = re.sub(r'[^a-zA-Z0-9]', '', os.path.splitext(original_filename)[0]).lower()

                # Reject if it looks like filename artifacts:
                # - Contains file extensions
                # - Is very short (< 3 chars)
                # - Matches common test/placeholder patterns
                # - Matches the original filename (after normalization)
                is_filename_artifact = (
                    len(cleaned_title) < 3 or
                    any(ext in cleaned_title.lower() for ext in ['.pdf', '.doc', '.txt']) or
                    cleaned_title.lower() in ['document', 'file', 'untitled', 'test', 'testclient'] or
                    normalized_title == normalized_filename or  # Catches sanitized filenames
                    # Also check if user_title is suspiciously similar (>80% match)
                    (len(normalized_title) > 0 and len(normalized_filename) > 0 and
                     len(set(normalized_title) & set(normalized_filename)) / max(len(set(normalized_title)), len(set(normalized_filename))) > 0.9)
                )

                if not is_filename_artifact:
                    final_type = cleaned_title.upper().replace(' ', '-')
                    print(f"✅ Using user_title as document type: {final_type}")
                else:
                    print(f"⚠️ user_title '{user_title}' looks like filename artifact, using LLM-extracted type instead")

            # Use LLM-extracted type if user_title was invalid or not provided
            if not final_type:
                if extracted_type and extracted_type != 'DOCUMENT':
                    final_type = extracted_type
                    print(f"✅ Using LLM-extracted document type: {final_type}")
                else:
                    final_type = 'DOCUMENT'
                    print(f"⚠️ No valid type found, using default: {final_type}")

            extracted_type = final_type

            # Build filename based on naming option
            if naming_option == "add_timestamp":
                # Format: YYYYMMDD_DOCUMENTTYPE.ext (no client name, uppercase with dashes)
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

        # Get page count from PDF
        try:
            with fitz.open(pdf_path) as doc:
                total_pages = len(doc)
            print(f"📄 PDF has {total_pages} pages")
        except Exception as e:
            print(f"⚠️ Could not determine page count: {e}, using document count")
            total_pages = len(documents)

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
                lambda: create_vectorized_rag_system(documents, pdf_path, total_pages=total_pages)
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
    "rerank_top_n": 20,
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
    document_id: str,
    rag_manager: Any,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    user_title: Optional[str] = None,
    user_client_name: Optional[str] = None,
    counter: Optional[int] = None
) -> Dict[str, Any]:
    """
    STREAMLINED UPLOAD WORKFLOW - Single straight process:
    1. LLM-enhanced naming (completes before chat ready)
    2. Save file with final name
    3. Extract text and validate
    4. Build RAG system (vectorized with multi-granularity chunks)
    5. Register with RAG manager
    6. Return ready for chat
    """
    total_start_time = time.time()

    print("=" * 80)
    print("📤 STREAMLINED UPLOAD PROCESS")
    print("=" * 80)

    try:
        # ========================================
        # STEP 1: LLM-ENHANCED NAMING (BLOCKING - MUST COMPLETE)
        # ========================================
        print("🧠 [1/5] LLM-enhanced intelligent naming...")
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
        print(f"✅ [1/5] Naming complete: {intelligent_filename} ({naming_time:.2f}s)")

        # ========================================
        # STEP 2: SAVE FILE WITH FINAL NAME
        # ========================================
        print("💾 [2/5] Saving file with final name...")
        save_start = time.time()

        os.makedirs("sample_docs", exist_ok=True)
        file_path = os.path.join("sample_docs", intelligent_filename)

        # Handle naming conflicts
        if os.path.exists(file_path):
            base_name, ext = os.path.splitext(intelligent_filename)
            conflict_counter = 1
            while os.path.exists(file_path):
                file_path = os.path.join("sample_docs", f"{base_name}_{conflict_counter}{ext}")
                conflict_counter += 1
            intelligent_filename = os.path.basename(file_path)
            print(f"   ⚠️ Renamed to avoid conflict: {intelligent_filename}")

        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)

        save_time = time.time() - save_start
        print(f"✅ [2/5] File saved ({save_time:.2f}s)")

        # ========================================
        # STEP 3: EXTRACT TEXT & VALIDATE
        # ========================================
        print("📄 [3/5] Extracting text from PDF...")
        extract_start = time.time()

        try:
            from utils.file_handler import extract_text_from_pdf, validate_pdf_content
        except ImportError:
            import importlib.util
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

        extract_time = time.time() - extract_start
        print(f"✅ [3/5] Extracted {len(documents)} pages ({extract_time:.2f}s)")

        # ========================================
        # STEP 4: BUILD RAG SYSTEM (VECTORIZED + MULTI-GRANULARITY)
        # ========================================
        print("🔧 [4/5] Building RAG system...")
        rag_start = time.time()

        # Build RAG system directly (no nested function calls)
        rag_system = await VectorizedRAGBuilder.build_rag_system_fast(documents, file_path)

        if not rag_system or "query_engine" not in rag_system:
            raise Exception("RAG system incomplete")

        rag_time = time.time() - rag_start
        print(f"✅ [4/5] RAG system ready ({rag_time:.2f}s)")

        # ========================================
        # STEP 5: REGISTER WITH RAG MANAGER
        # ========================================
        print("📝 [5/5] Registering with RAG manager...")
        register_start = time.time()

        rag_manager.set_system(
            document_id=document_id,
            rag_system=rag_system,
            file_path=file_path,
            user_id=user_id,
            session_id=session_id
        )

        register_time = time.time() - register_start
        print(f"✅ [5/5] Registered ({register_time:.2f}s)")

        # ========================================
        # COMPLETION
        # ========================================
        total_time = time.time() - total_start_time

        print("=" * 80)
        print(f"🎉 UPLOAD COMPLETE - READY FOR CHAT ({total_time:.2f}s)")
        print("=" * 80)
        print(f"   📊 Timing Breakdown:")
        print(f"      1. Naming:     {naming_time:.2f}s")
        print(f"      2. Save:       {save_time:.2f}s")
        print(f"      3. Extract:    {extract_time:.2f}s")
        print(f"      4. RAG Build:  {rag_time:.2f}s")
        print(f"      5. Register:   {register_time:.2f}s")
        print(f"   📄 File: {intelligent_filename}")
        print(f"   📚 Pages: {len(documents)}")
        print(f"   🚀 Status: Ready for chat!")
        print("=" * 80)

        return {
            "file_path": file_path,
            "filename": intelligent_filename,
            "rag_system": rag_system,
            "documents": documents,
            "page_count": len(documents),
            "document_id": document_id,
            "timing": {
                "naming": naming_time,
                "save": save_time,
                "extract": extract_time,
                "rag": rag_time,
                "register": register_time,
                "total": total_time
            }
        }

    except Exception as e:
        print(f"❌ Upload failed: {e}")
        # Clean up the saved file on failure
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
                print(f"🗑️ Cleaned up file: {file_path}")
            except:
                pass
        raise


async def instant_upload_workflow(
    file_content: bytes,
    original_filename: str,
    naming_option: str,
    document_id: str,
    rag_manager: Any,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    user_title: Optional[str] = None,
    user_client_name: Optional[str] = None,
    counter: Optional[int] = None
) -> Dict[str, Any]:
    """
    INSTANT UPLOAD: Save file + return immediately, build RAG in background.

    Returns in 2-5 seconds, RAG builds asynchronously.
    """
    total_start_time = time.time()

    try:
        # Mark as processing
        BackgroundRAGTracker.set_processing(document_id)

        # STEP 1: Use temporary filename immediately (NO LLM DELAY!)
        print("⚡ Step 1: Using temporary filename (instant)...")
        naming_start = time.time()

        # Generate temp filename from document_id
        timestamp = int(time.time() * 1000)
        temp_filename = f"temp_{document_id}_{timestamp}.pdf"

        naming_time = time.time() - naming_start

        # STEP 2: Save file immediately with temp name
        print("💾 Step 2: Saving file with temp name...")
        save_start = time.time()

        os.makedirs("sample_docs", exist_ok=True)
        temp_file_path = os.path.join("sample_docs", temp_filename)

        # Save file immediately with temp name
        with open(temp_file_path, 'wb') as f:
            f.write(file_content)

        save_time = time.time() - save_start

        # STEP 3: Quick validation
        print("🔍 Step 3: Quick validation...")
        validation_start = time.time()

        try:
            from utils.file_handler import validate_pdf_content
        except ImportError:
            import importlib.util
            file_handler_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'utils', 'file_handler.py')
            if os.path.exists(file_handler_path):
                spec = importlib.util.spec_from_file_location("file_handler", file_handler_path)
                file_handler = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(file_handler)
                validate_pdf_content = file_handler.validate_pdf_content
            else:
                raise ImportError("Cannot find utils.file_handler module")

        validation = validate_pdf_content(temp_file_path)
        if not validation.get("is_valid", False):
            raise Exception("Invalid PDF content")

        # Get page count
        import fitz
        pdf = fitz.open(temp_file_path)
        page_count = len(pdf)
        pdf.close()

        validation_time = time.time() - validation_start
        instant_time = time.time() - total_start_time

        print(f"⚡ INSTANT READY in {instant_time:.2f}s!")
        print(f"   - Temp naming: {naming_time:.3f}s")
        print(f"   - Save: {save_time:.3f}s")
        print(f"   - Validation: {validation_time:.3f}s")
        print(f"   - Pages: {page_count}")
        print(f"🔄 Launching background: LLM naming + RAG build...")

        # STEP 4: Build RAG in background (non-blocking)
        # This includes BOTH intelligent naming AND RAG building
        async def build_rag_background():
            """Background task: LLM rename + RAG build."""
            try:
                # Sub-step 1: Intelligent naming (in background, doesn't block user)
                BackgroundRAGTracker.update_stage(document_id, "generating_smart_filename")

                print(f"🧠 [Background] Generating smart filename for {document_id}...")
                intelligent_filename = await RuleBasedFileNamer.generate_filename_ultra_fast(
                    file_content=file_content,
                    original_filename=original_filename,
                    naming_option=naming_option,
                    user_title=user_title,
                    user_client_name=user_client_name,
                    counter=counter
                )

                # Rename file to intelligent name
                final_file_path = os.path.join("sample_docs", intelligent_filename)

                # Handle naming conflicts
                if os.path.exists(final_file_path):
                    base_name, ext = os.path.splitext(intelligent_filename)
                    conflict_counter = 1
                    while os.path.exists(final_file_path):
                        final_file_path = os.path.join("sample_docs", f"{base_name}_{conflict_counter}{ext}")
                        conflict_counter += 1
                    intelligent_filename = os.path.basename(final_file_path)

                # Rename from temp to final name
                os.rename(temp_file_path, final_file_path)
                print(f"✅ [Background] Renamed to: {intelligent_filename}")

                # Sub-step 2: Extract text
                BackgroundRAGTracker.update_stage(document_id, "extracting_text")

                from utils.file_handler import extract_text_from_pdf
                documents = extract_text_from_pdf(final_file_path)

                if not documents:
                    raise Exception("No text extracted from PDF")

                print(f"📄 [Background] Extracted {len(documents)} document chunks for {document_id}")

                # Sub-step 3: Build RAG embeddings
                BackgroundRAGTracker.update_stage(document_id, "building_embeddings")
                rag_system = await VectorizedRAGBuilder.build_rag_system_fast(documents, final_file_path)

                if not rag_system or "query_engine" not in rag_system:
                    raise Exception("RAG system incomplete")

                # Register with RAG manager
                rag_manager.set_system(
                    document_id=document_id,
                    rag_system=rag_system,
                    file_path=final_file_path,
                    user_id=user_id,
                    session_id=session_id
                )

                # Store final filename in tracker
                BackgroundRAGTracker.set_ready(document_id, rag_system)
                BackgroundRAGTracker.processing_status[document_id]["final_filename"] = intelligent_filename
                print(f"✅ [Background] RAG ready for {document_id}")
                print(f"   Final filename: {intelligent_filename}")

            except Exception as e:
                BackgroundRAGTracker.set_error(document_id, str(e))
                print(f"❌ [Background] RAG build failed for {document_id}: {e}")

        # Launch background task
        asyncio.create_task(build_rag_background())

        return {
            "file_path": temp_file_path,
            "filename": temp_filename,  # Return temp filename initially
            "temp_filename": temp_filename,
            "document_id": document_id,
            "page_count": page_count,
            "instant_ready_time": instant_time,
            "rag_status": "building",
            "renaming_in_progress": True,  # Signal to frontend
            "timing": {
                "naming": naming_time,
                "save": save_time,
                "validation": validation_time,
                "instant_total": instant_time
            }
        }

    except Exception as e:
        print(f"❌ Instant upload failed: {e}")
        BackgroundRAGTracker.set_error(document_id, str(e))

        # Clean up file on failure
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
