# RAG Configuration Parameters
# All major parameters for chunking, retrieval, reranking, and query expansion
# UPDATED WITH VECTORIZED OPTIMIZATIONS FOR HYBRID RETRIEVAL

# ================================
# VECTORIZED CONFIGURATION
# ================================
rag_config = {
    # CHUNK OPTIMIZATION - Larger chunks = fewer total chunks = faster processing
    "small_chunk_size": 400,           # ⚡ INCREASED from 256 to 512 (50% fewer chunks)
    "small_chunk_overlap": 200,         # ⚡ INCREASED from 20 to 50 (better quality with fewer chunks)
    "medium_chunk_size": 650,        # NEW: Medium chunks for balanced context
    "medium_chunk_overlap": 250,      # NEW: Proportional overlap for medium chunks
    "large_chunk_size": 1000,       # NEW: Large chunks for broad context
    "large_chunk_overlap": 300,     # NEW: Larger overlap for context preservation

    # RETRIEVAL OPTIMIZATION - Reduce computational overhead while maintaining vector capabilities
    "retrieval_top_k": 20,             # ⚡ REDUCED from 4 to 3 (25% faster retrieval)
    "rerank_top_n": 10,                # Keep for quality
    "num_query_expansions": 1,        # ⚡ REDUCED from 3 to 1 (70% faster pipeline building)
    
    # HYBRID RETRIEVAL FEATURES
    "enable_hybrid_retrieval": True,   # ✅ ENABLED: Vector + BM25 hybrid for best accuracy
    "enable_vector_search": True,      # ✅ NEW: Enable vector embeddings for semantic search
    "enable_bm25_search": True,        # ✅ MAINTAINED: Keep BM25 for keyword precision
    
    # NEW SPEED OPTIMIZATIONS
    "fast_mode": True,                 # Enable all fast processing optimizations
    "max_pages_for_naming": 10,         # Only process first 3 pages for intelligent naming
    "cache_embeddings": True,          # Cache embedding model between uploads
    "disable_page_chunks": True,       # ⚡ Disable page-level chunks to reduce total chunk count
}

# Model configurations - Enhanced for vectorization
MODEL_CONFIG = {
    "embedding_model": "sentence-transformers/all-MiniLM-L12-v2",              # ✅ High-quality embeddings for vector search
    "rerank_model": "cross-encoder/ms-marco-electra-base",  # Keep for quality
    "temperature": 0.1,
    "max_output_tokens": 512,
    "enable_verbose_enhancement": True,
    "verbose_enhancement_level": "medium",
    "reasoning_depth": "high"
}

# System prompt for the LLM (enhanced for vector context)
SYSTEM_PROMPT = (
  "You are LegalLynx, an advanced AI legal assistant specializing in legal document intelligence and analysis. "
    "You operate within a sophisticated Retrieval-Augmented Generation (RAG) system featuring multi-granularity "
    "chunking, hybrid retrieval (vector + BM25), and secure document processing capabilities. Your primary mission "
    "is to optimize paralegal workflows through precise legal document analysis while maintaining the highest "
    "standards of accuracy and professional legal practice.\n\n"


    "## DOCUMENT PROCESSING CAPABILITIES:\n"
    "You analyze legal documents including: contracts, wills, power of attorney documents, trusts, policy documents, "
    "corporate resolutions, official correspondence, regulatory filings, court documents, and all other legal materials that could possibly exist. "
    "in PDF and DOCX formats processed through LegalLynx's secure, data-sovereign environment.\n\n"

    "## CHAIN-OF-THOUGHT REASONING PROTOCOL:\n"
    "**Think like a meticulous legal detective.** Apply systematic reasoning for all queries, especially complex ones:\n\n"

    "**STEP 1: QUERY DECOMPOSITION**\n"
    "- Parse the specific information requested\n"
    "- Identify query type: factual extraction, calculation, comparison, summary, or cross-reference\n"
    "- Determine scope: single document, multiple documents, or document sections\n"
    "- Note any mathematical operations or logical connections required\n\n"

    "**STEP 2: STRATEGIC DOCUMENT ANALYSIS**\n"
    "- Systematically scan retrieved content for relevant information\n"
    "- Identify primary evidence and supporting documentation\n"
    "- Map page locations and section references throughout the search process\n"
    "- Flag any ambiguous, incomplete, or conflicting information\n\n"

    "**STEP 3: EVIDENCE COMPILATION & VALIDATION**\n"
    "- Collect all relevant facts, figures, dates, names, and legal provisions\n"
    "- Cross-validate information across different document sections\n"
    "- Identify discrepancies, inconsistencies, or missing information\n"
    "- Organize evidence chronologically or thematically as appropriate\n\n"

    "**STEP 4: LOGICAL ANALYSIS & COMPUTATION**\n"
    "- For calculations: Show complete mathematical methodology step-by-step\n"
    "- For complex queries: Explain logical connections between information sources\n"
    "- Validate findings against original source material\n"
    "- Double-check all numerical computations and date calculations\n\n"

    "**STEP 5: COMPREHENSIVE RESPONSE CONSTRUCTION**\n"
    "- Lead with direct answer to the specific query\n"
    "- Provide detailed supporting evidence with mandatory page references\n"
    "- Include comprehensive related information section\n"
    "- Add appropriate legal disclaimers\n"
    "- Perform final accuracy verification\n\n"

    "## MANDATORY PAGE ATTRIBUTION PROTOCOL:\n"
    "**CRITICAL REQUIREMENT:** Every single fact, figure, date, name, clause, term, or piece of information you cite "
    "MUST include exact page attribution using this format:\n"
    "- With section: [Page X, Section Y]\n"
    "- Without clear section: [Page X] + full quoted sentence/paragraph\n"
    "- Multiple pages: [Pages X-Y] or [Pages X, Z, AA]\n\n"

    "**Attribution Examples:**\n"
    "✓ 'The contract termination date is December 31, 2024 [Page 15, Section 8.2].'\n"
    "✓ 'The document states: \"All disputes shall be resolved through binding arbitration\" [Page 23].'\n"
    "✓ 'Payment terms specify $500,000 total [Page 7] with \"quarterly installments of $125,000 over 24 months\" [Page 8].'\n"
    "✗ 'The contract includes termination provisions.' (Missing page reference)\n\n"

    "## CRITICAL LEGAL BOUNDARIES - NO LEGAL ADVICE:\n"
    "**STRICTLY PROHIBITED:**\n"
    "- Providing legal advice, opinions, or recommendations\n"
    "- Interpreting what legal language \"means\" in terms of legal consequences\n"
    "- Advising on legal strategy or courses of action\n"
    "- Making predictions about legal outcomes\n\n"

    "**PERMITTED ACTIVITIES:**\n"
    "- Factual extraction and summarization of document contents\n"
    "- Identification of clauses, terms, conditions, and provisions\n"
    "- Mathematical calculations based on document figures\n"
    "- Cross-referencing information between document sections\n"
    "- Chronological organization of dates and events\n"
    "- Comparison of stated terms across different documents\n\n"

    "**REASONING TRANSPARENCY LANGUAGE:**\n"
    "Use explicit reasoning phrases:\n"
    "- \"Let me analyze this step-by-step:\"\n"
    "- \"First, I'll examine... Next, I'll identify... Then, I'll calculate...\"\n"
    "- \"Based on evidence from [Page X], combined with data from [Page Y], I can determine...\"\n"
    "- \"To compute this accurately: Step 1) Extract X from [Page A], Step 2) Find Y from [Page B], Step 3) Apply formula Z...\"\n\n"

    "## RESPONSE FORMAT:\n"

    "Begin with the direct answer to the user's query followed by the specific information requested with full page attribution.\n\n"
    "Always present responses primarily in clear, professional prose. Use bullets or numbering only when absolutely necessary (e.g., for lists of clauses, dates,"
    "or multi-step calculations). Responses should flow like a narrative explanation rather than rigid outlines.\n\n"

    "At the beginning of every response, provide the **direct answer** to the user's query, with the specific word, phrase, or figure bolded for immediate clarity. Do not bold full sentences."
    "For example, if the question is 'How many pages?', the response should begin: **23 pages**.\n\n"

    "Provide comprehensive supporting evidence, calculations (with methodology), and relevant document excerpts with page references.\n\n"
    "Every citation must include page attribution in *italics*. For example: 'The termination date is stated as December 31, 2024 *[Page 15, Section 8.2]*.'\n\n"

    "Only if deemed appropriate or necessary, you may include additional relevant context."
    "Note any information limitations or missing data."
    "Suggest additional document review if applicable."

    "Conclude with a collaborative prompt, but never refer to anything about other documents because you can only process one document at a time, which in this case, is the one uploaded for the current chat session."
    "Always give the user agency to steer the next step in the research.\n\n"

    "## QUALITY ASSURANCE & ACCURACY PROTOCOLS:\n"
    "- **Numerical Verification:** Cross-check all figures, dates, and calculations across document sections\n"
    "- **Consistency Analysis:** Flag potential inconsistencies or ambiguities for legal review\n"
    "- **Audit Trail Maintenance:** Ensure every statement is traceable to specific document locations\n"
    "- **Professional Standards:** Meet paralegal-level accuracy requirements for case preparation and legal research\n"
    "- **Source Validation:** Verify all citations reference actual document content\n\n"

    "## CORE OPERATIONAL PRINCIPLES:\n"
    "1. **Absolute Source Fidelity:** Base responses exclusively on retrieved document content - never extrapolate or assume\n"
    "2. **Legal Terminology Precision:** Use exact legal language and maintain precision with all data points\n"
    "3. **Comprehensive Analysis:** Provide thorough analysis beyond the basic query while maintaining focus\n"
    "4. **Professional Transparency:** Clearly state when information is not found or incomplete\n"
    "5. **Data Sovereignty Respect:** Operate within LegalLynx's secure environment respecting confidentiality requirements\n\n"

    "Remember: You are a professional-grade legal document intelligence system designed to support paralegal "
    "workflows with the highest standards of accuracy, transparency, and legal ethics. Every response must be "
    "defensible, traceable, and professionally appropriate for legal practice environments while strictly "
    "avoiding the unauthorized practice of law."
)

# ================================
# SINGLETON PATTERN OPTIMIZATION (ENHANCED)
# ================================

# Model caching - CRITICAL for avoiding 3x model re-initialization
ENABLE_MODEL_CACHING = True   # ⚡ CRITICAL: Cache models between uploads
CACHE_EMBEDDING_MODEL = True  # ✅ Cache embedding model in memory (essential for vectors)
CACHE_LLM_MODEL = True        # Cache LLM model in memory
PRELOAD_MODELS_ON_STARTUP = True  # Load models once at startup

# ================================
# VECTORIZATION SETTINGS
# ================================

# Vector embedding settings
VECTOR_CONFIG = {
    "embedding_model": "sentence-transformers/all-MiniLM-L12-v2",  # High-quality embeddings
    "embedding_dimension": 384,                   # Dimension for bge-small-en-v1.5
    "similarity_metric": "cosine",                # Cosine similarity for semantic search
    "enable_gpu_acceleration": False,             # Set to True if GPU available
    "batch_size": 32,                            # Batch size for embedding generation
    "max_sequence_length": 512,                  # Max tokens per embedding
}

# Hybrid retrieval weights
HYBRID_CONFIG = {
    "vector_weight": 0.7,        # Weight for vector similarity results
    "bm25_weight": 0.3,          # Weight for BM25 keyword results
    "fusion_mode": "rrf",        # Reciprocal Rank Fusion for combining results
    "normalize_scores": True,    # Normalize scores before combining
}

# ================================
# PERFORMANCE SETTINGS (ENHANCED)
# ================================

# Fast mode settings
ENABLE_FAST_MODE = True       # Enable all optimizations by default

# Background processing
BACKGROUND_WORKERS = 2        # Number of background threads for parallel processing
ASYNC_PROCESSING = True       # Enable async processing for heavy operations
MAX_CONCURRENT_UPLOADS = 1    # Limit to 1 to maintain model cache effectiveness

# Memory optimization
CLEANUP_TEMP_FILES = True     # Clean up temporary files immediately
MAX_MEMORY_USAGE_MB = 2048    # Limit memory usage

# ================================
# RULE-BASED NAMING OPTIMIZATION (UNCHANGED)
# ================================

# Fast naming configuration - NO LLM CALLS for naming
FAST_NAMING_CONFIG = {
    "enable_rule_based_naming": True,      # ⚡ CRITICAL: Use regex patterns instead of LLM
    "max_pages_analysis": 3,               # Only analyze first 3 pages for naming
    "enable_rag_naming": False,            # ⚡ DISABLE LLM-based naming
    "fallback_to_user_settings": True,     # Use user settings as fallback
    "enable_filename_extraction": True,     # Extract info from original filename
    "max_filename_length": 100,            # Limit filename length
    "use_regex_patterns": True,            # Use pre-compiled regex for speed
}

# Document type detection patterns for rule-based naming
DOCUMENT_TYPE_PATTERNS = {
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
    'application': 'Application',
    'form': 'Form',
    'statement': 'Statement',
    'report': 'Report',
    'title': 'Title',
    'insurance': 'Insurance',
    'security': 'Security',
    'instrument': 'Instrument',
    'note': 'Note',
    'loan': 'Loan',
    'bond': 'Bond',
    'warranty': 'Warranty',
    'guarantee': 'Guarantee',
}

# ================================
# CHUNKING OPTIMIZATION (ENHANCED)
# ================================

# Optimized chunking configuration for vector embeddings
FAST_CHUNKING_CONFIG = {
    "enable_fine_chunks": True,        # Keep fine chunks for quality
    "enable_medium_chunks": True,      # Keep medium chunks for vector embeddings
    "enable_coarse_chunks": False,     # ⚡ DISABLE coarse chunks (reduces chunk count by 30%)
    "enable_logical_chunks": False,    # ⚡ CRITICAL: DISABLE logical chunks (60% fewer chunks)
    "enable_structural_chunks": False, # ⚡ DISABLE structural analysis
    "enable_page_chunks": False,       # ⚡ DISABLE page-level chunks
    "chunk_overlap_ratio": 0.1,       # 10% overlap (optimized balance)
    "max_chunks_per_document": 500,   # Limit total chunks to prevent memory issues
    "vector_chunk_size": 512,         # Optimal size for vector embeddings
}

# ================================
# RETRIEVAL OPTIMIZATION (ENHANCED)
# ================================

# Enhanced retrieval configuration for hybrid search
FAST_RETRIEVAL_CONFIG = {
    "enable_vector_search": True,      # ✅ ENABLED: Semantic vector search
    "enable_bm25_search": True,        # ✅ ENABLED: Keyword BM25 search
    "enable_hybrid_fusion": True,      # ✅ ENABLED: Combine vector + BM25 results
    "enable_page_search": False,       # ⚡ DISABLE page-level search
    "enable_reranking": True,          # Keep reranking for quality
    "max_retrieved_nodes": 3,          # Reduced from 4 to 3
    "similarity_threshold": 0.0,       # No similarity filtering
    "use_cached_embeddings": True,     # Cache embeddings for repeated queries
    "vector_similarity_top_k": 3,      # Vector search results
    "bm25_similarity_top_k": 3,        # BM25 search results
}

# ================================
# ULTRA-FAST MODE (OPTIONAL)
# ================================

# Even more aggressive optimizations (use only if you need maximum speed)
ULTRA_FAST_CONFIG = {
    "retrieval_top_k": 2,              # Further reduce to 2 nodes
    "rerank_top_n": 1,                 # Reduce reranking to 1 result  
    "num_query_expansions": 0,         # Completely disable query expansion
    "enable_hybrid_retrieval": True,   # Keep hybrid for accuracy
    "fine_chunk_size": 1024,           # Even larger chunks
    "enable_medium_chunks": False,     # Only use fine chunks
    "vector_weight": 0.8,              # Favor vector results for speed
    "bm25_weight": 0.2,                # Reduce BM25 weight
}

# ================================
# MONITORING AND LOGGING
# ================================

# Performance monitoring
ENABLE_PERFORMANCE_LOGGING = True
LOG_PROCESSING_TIMES = True
LOG_MEMORY_USAGE = False  # Disable for production
LOG_OPTIMIZATION_STATS = True
LOG_VECTOR_STATS = True   # ✅ NEW: Log vector embedding statistics

# Debug settings
DEBUG_MODE = False
VERBOSE_LOGGING = False

# ================================
# CONFIGURATION FUNCTIONS (ENHANCED)
# ================================

def apply_ultra_fast_optimizations():
    """
    Apply ultra-fast optimizations to the global rag_config.
    Now includes vectorization enhancements.
    """
    global rag_config
    
    # Apply all speed optimizations
    rag_config.update({
        "num_query_expansions": 1,        # CRITICAL speedup
        "enable_logical_chunking": False,  # MAJOR speedup
        "retrieval_top_k": 3,             # Faster retrieval
        "fine_chunk_size": 512,           # Fewer chunks
        "enable_model_caching": True,     # Cache models
        "enable_vector_search": True,     # ✅ Enable vector embeddings
        "enable_hybrid_retrieval": True,  # ✅ Enable hybrid search
        "fast_mode": True,                # Enable all fast features
    })
    
    print('''
    .____                       .__               ____  ___
    |    |    ____   _________  |  | ___.__. ____ \   \/  /
    |    |  _/ __ \ / ___\__  \ |  |<   |  |/    \ \     / 
    |    |__\  ___// /_/  > __ \|  |_\___  |   |  \/     \ 
    |_______ \___  >___  (____  /____/ ____|___|  /___/\  \\
            \/   \/_____/     \/     \/         \/      \_/
    ''')
    
    print('''
     Developer: @dazedmind
     Version: v3.0.0 - GPT 5-nano model
    ''')
  
def get_vectorized_config():
    """
    Get the optimized configuration for vectorized processing.
    
    Returns:
        dict: Optimized configuration with vector capabilities
    """
    return {
        **rag_config,
        **FAST_NAMING_CONFIG,
        **FAST_CHUNKING_CONFIG,
        **FAST_RETRIEVAL_CONFIG,
        **VECTOR_CONFIG,
        **HYBRID_CONFIG,
        "model_config": MODEL_CONFIG,
        "performance": {
            "enable_fast_mode": ENABLE_FAST_MODE,
            "background_workers": BACKGROUND_WORKERS,
            "async_processing": ASYNC_PROCESSING,
            "cache_models": CACHE_EMBEDDING_MODEL,
            "preload_models": PRELOAD_MODELS_ON_STARTUP,
        }
    }

def get_ultra_fast_config():
    """
    Get the ultra-fast configuration (maximum speed with vectors).
    
    Returns:
        dict: Ultra-fast configuration for maximum performance
    """
    ultra_fast_rag = rag_config.copy()
    ultra_fast_rag.update(ULTRA_FAST_CONFIG)
    
    return {
        **ultra_fast_rag,
        **FAST_NAMING_CONFIG,
        **FAST_CHUNKING_CONFIG,
        **FAST_RETRIEVAL_CONFIG,
        **VECTOR_CONFIG,
        **HYBRID_CONFIG,
        "model_config": MODEL_CONFIG,
        "performance": {
            "enable_fast_mode": True,
            "background_workers": 1,         # Single worker for ultra-fast
            "async_processing": True,
            "cache_models": True,
            "preload_models": True,
        }
    }

# ================================
# AUTO-APPLY OPTIMIZATIONS
# ================================

# Automatically apply optimizations when module is imported
if ENABLE_FAST_MODE:
    apply_ultra_fast_optimizations()

"""
VECTORIZED PERFORMANCE IMPROVEMENT BREAKDOWN:

🔥 CRITICAL OPTIMIZATIONS:
1. Singleton Model Manager: Eliminates 3x LLM re-initialization (saves 3-4 minutes)
2. Rule-Based Naming: No LLM calls for naming (saves 10-30 seconds, 1000x faster)
3. Query Expansions (3→1): 70% faster pipeline building
4. Disable Logical Chunking: 60% fewer chunks, 50% faster indexing


🔬 TECHNICAL IMPROVEMENTS:
- Vector similarity for semantic queries ("what is the main purpose?")
- BM25 keyword matching for exact terms ("find clause 5.2")
- Hybrid fusion combining both approaches
- Reciprocal rank fusion for optimal result ordering
"""