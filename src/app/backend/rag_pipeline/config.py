# RAG Configuration Parameters

# ================================
# RAG CONFIGURATION - VERY AGGRESSIVE + MEDIUM CHUNKS
# ================================
rag_config = {
    # Three chunk sizes for demo
    "small_chunk_size": 400,
    "small_chunk_overlap": 200,
    "medium_chunk_size": 650,     # NEW: Between small and large
    "medium_chunk_overlap": 250,  # NEW: Medium overlap
    "large_chunk_size": 1000,
    "large_chunk_overlap": 300,

    "retrieval_top_k": 20,         # NOTE: This will be overridden by adaptive config
    "rerank_top_n": 10,            # NOTE: This will be overridden by adaptive config
    "num_query_expansions": 1,
}

# ================================
# ADAPTIVE CONFIGURATION FUNCTION
# ================================
def get_adaptive_config(total_pages, num_questions=1):
    """
    Get adaptive RAG configuration based on document size and question complexity.
    
    🎯 CRITICAL: This function enables dynamic scaling to match Colab's superior performance.
    When handling 6 questions, this scales retrieval from 20 → ~40-60 chunks (2x multiplier).
    
    Args:
        total_pages: Total pages in the document
        num_questions: Number of questions detected in the query (e.g., 6 for multi-question)
    
    Returns:
        Dict with optimized retrieval_top_k, rerank_top_n, and max_tokens
    """
    
    # Base configuration based on document size
    if total_pages <= 20:
        # Small documents: faster, more precise
        base_config = {
            "retrieval_top_k": 15,   # Small doc baseline
            "rerank_top_n": 8,       # Moderate reranking
            "max_tokens": 1024       # Shorter responses for small docs
        }
    elif total_pages <= 100:
        # Large documents: comprehensive retrieval
        base_config = {
            "retrieval_top_k": 25,   # Medium doc baseline
            "rerank_top_n": 12,      # More reranking needed
            "max_tokens": 1600       # Longer responses for complexity
        }
    else:
        # Extra large documents: maximum coverage
        base_config = {
            "retrieval_top_k": 35,   # Large doc baseline
            "rerank_top_n": 18,      # Extensive reranking
            "max_tokens": 2048       # Maximum response length
        }
    
    # 🎯 KEY FIX: Scale up for multiple questions (up to 2x, capped for performance)
    # This is what makes Colab retrieve 40-60 chunks for 6 questions vs FastAPI's static 20
    if num_questions > 1:
        # Calculate multiplier: 1 question = 1.0x, 2 = 1.3x, 3 = 1.6x, 4+ = 2.0x (capped)
        multiplier = min(1 + (num_questions - 1) * 0.3, 2.0)
        
        # Apply multiplier to all retrieval parameters
        base_config["retrieval_top_k"] = int(base_config["retrieval_top_k"] * multiplier)
        base_config["rerank_top_n"] = int(base_config["rerank_top_n"] * multiplier)
        base_config["max_tokens"] = min(int(base_config["max_tokens"] * multiplier), 2048)
        
        # 🎯 JUSTIFICATION: This scaling ensures sufficient context for each question
        # Example: 6 questions on 50-page doc → 25 * 2.0 = 50 chunks retrieved
    
    return base_config


# Model configurations
MODEL_CONFIG = {
    "embedding_model": "sentence-transformers/all-MiniLM-L12-v2",
    "rerank_model": "cross-encoder/ms-marco-electra-base",
    "temperature": 0.1,
    "max_output_tokens": 2000,
}