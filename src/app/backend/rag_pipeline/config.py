# RAG Configuration Parameters
# All major parameters for chunking, retrieval, reranking, and query expansion

rag_config = {
    "fine_chunk_size": 256,
    "fine_chunk_overlap": 20,
    "coarse_chunk_size": 1024,
    "retrieval_top_k": 4,
    "rerank_top_n": 2,
    "num_query_expansions": 3
}

# Model configurations
MODEL_CONFIG = {
    # "llm_model": "models/gemini-2.0-flash",
    "llm_model": "llama3-8b-8192",  # Groq model
    "embedding_model": "BAAI/bge-small-en-v1.5",
    "rerank_model": "cross-encoder/ms-marco-MiniLM-L-12-v2",
    "max_output_tokens": 1024
}

# OCR configurations
OCR_CONFIG = {
    "text_threshold": 100,  # Threshold to determine if PDF is scanned
    "confidence_threshold": 30,  # OCR confidence threshold
    "scale_percent": 200,  # Image scaling for OCR
    "tesseract_config": r'--oem 3 -l eng'
}

# System prompt for the LLM
SYSTEM_PROMPT = (
    "You are a highly skilled assistant specializing in analyzing legal documents, "
    "such as contracts, agreements, and other legal documents.\n\n"
    "Your task is to accurately extract and reason over the content retrieved from these documents. "
    "Always rely on the retrieved context only — do not assume or hallucinate any values or terms.\n\n"
    "When answering:\n"
    "- Be precise with all numerical values, dates, and percentages.\n"
    "- If the information is not in the retrieved content, respond clearly that it was not found.\n"
    "- Use legal-specific terminology appropriately and avoid ambiguity.\n\n"
    "You are being used in a legal setting where accuracy and clarity are critical."
)