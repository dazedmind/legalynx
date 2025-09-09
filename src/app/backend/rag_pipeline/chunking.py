# rag_pipeline/chunking.py - True Multi-Granularity Implementation

from typing import List
from llama_index.core import Document
from llama_index.core.schema import TextNode
from llama_index.core.text_splitter import SentenceSplitter
from llama_index.core.node_parser import SimpleNodeParser
from rag_pipeline.config import rag_config

def multi_granularity_chunking(documents: List[Document], pdf_path: str, text_threshold: int = 100) -> List[TextNode]:
    """
    Generate true multi-granularity chunks - same content at different chunk sizes.
    Also includes the original hierarchical approach for backward compatibility.
    
    This creates:
    1. Small chunks (256 tokens) - fine-grained context
    2. Medium chunks (512 tokens) - balanced context  
    3. Large chunks (1024 tokens) - broad context
    """
    # Since we removed OCR, treat all documents as structured
    is_scanned = False  # Always False since we don't support scanned PDFs
    
    all_nodes = []

    # =======================
    # TRUE MULTI-GRANULARITY: Same content at different sizes
    # =======================
    for i, doc in enumerate(documents):
        text = doc.text

        # Create multiple chunk sizes of the SAME content
        # Small chunks (256 tokens)
        small_splitter = SentenceSplitter(
            chunk_size=rag_config["small_chunk_size"],
            chunk_overlap=rag_config["small_chunk_overlap"]
        )
        small_chunks = small_splitter.get_nodes_from_documents([doc])

        # Medium chunks (512 tokens) - same content, larger context
        medium_splitter = SentenceSplitter(
            chunk_size=rag_config["medium_chunk_size"],  # Between fine and coarse
            chunk_overlap=rag_config["medium_chunk_overlap"]   # Proportional overlap
        )
        medium_chunks = medium_splitter.get_nodes_from_documents([doc])

        # Large chunks (1024 tokens) - same content, largest context
        large_splitter = SentenceSplitter(
            chunk_size=rag_config["large_chunk_size"],
            chunk_overlap=rag_config["large_chunk_overlap"]
        )
        large_chunks = large_splitter.get_nodes_from_documents([doc])

        # Tag each chunk with granularity level and page info
        for node in small_chunks:
            node.metadata["chunk_type"] = "small"
            node.metadata["granularity"] = "detailed"
            node.metadata["page_number"] = i + 1

        for node in medium_chunks:
            node.metadata["chunk_type"] = "medium"  # New granularity level
            node.metadata["granularity"] = "balanced"
            node.metadata["page_number"] = i + 1

        for node in large_chunks:
            node.metadata["chunk_type"] = "large"
            node.metadata["granularity"] = "contextual"
            node.metadata["page_number"] = i + 1

        # Add to respective collections (keeping original structure)
        all_nodes.extend(small_chunks)
        all_nodes.extend(medium_chunks)
        all_nodes.extend(large_chunks)

def create_semantic_chunks(documents: List[Document], chunk_size: int = 512, 
                          chunk_overlap: int = 50) -> List[TextNode]:
    """
    Create semantic chunks using sentence-based splitting.
    Alternative chunking method for different use cases.
    """
    splitter = SentenceSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    
    nodes = []
    for doc in documents:
        doc_nodes = splitter.get_nodes_from_documents([doc])
        for node in doc_nodes:
            node.metadata["chunk_type"] = "semantic"
            node.metadata.update(doc.metadata)
        nodes.extend(doc_nodes)
    
    return nodes