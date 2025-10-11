# rag_pipeline/chunking.py - Railway-Optimized Multi-Granularity Implementation

import time
from typing import List, Dict, Any
from llama_index.core import Document
from llama_index.core.schema import TextNode
from llama_index.core.text_splitter import SentenceSplitter
from llama_index.core.node_parser import SimpleNodeParser
from rag_pipeline.config import rag_config

def adaptive_multi_granularity_chunking(documents: List[Document], pdf_path: str, total_pages: int = None, text_threshold: int = 100) -> List[TextNode]:
    """
    🚀 RAILWAY-OPTIMIZED: Adaptive multi-granularity chunking with intelligent sizing.
    Reduces total chunks → fewer embedding calls → faster processing.
    
    Adaptive chunk sizes based on document size:
    - ≤ 20 pages → 600-1200 chars per chunk
    - ≤ 100 pages → 1000-2000 chars per chunk  
    - > 100 pages → 1500-3000 chars per chunk
    """
    print(f"🔄 Starting adaptive chunking for {len(documents)} documents...")
    start_time = time.time()
    
    # Determine adaptive chunk sizes based on document size
    if total_pages is None:
        total_pages = len(documents)
    
    if total_pages <= 20:
        chunk_config = {
            "small_chunk_size": 600,
            "medium_chunk_size": 800,
            "large_chunk_size": 1200,
            "small_chunk_overlap": 100,
            "medium_chunk_overlap": 150,
            "large_chunk_overlap": 200
        }
        print(f"📏 Small document ({total_pages} pages): Using compact chunks")
    elif total_pages <= 100:
        chunk_config = {
            "small_chunk_size": 1000,
            "medium_chunk_size": 1500,
            "large_chunk_size": 2000,
            "small_chunk_overlap": 150,
            "medium_chunk_overlap": 200,
            "large_chunk_overlap": 300
        }
        print(f"📏 Medium document ({total_pages} pages): Using balanced chunks")
    else:  # > 100 pages
        chunk_config = {
            "small_chunk_size": 1500,
            "medium_chunk_size": 2000,
            "large_chunk_size": 3000,
            "small_chunk_overlap": 200,
            "medium_chunk_overlap": 300,
            "large_chunk_overlap": 400
        }
        print(f"📏 Large document ({total_pages} pages): Using large chunks for efficiency")
    
    all_nodes = []

    # =======================
    # ADAPTIVE MULTI-GRANULARITY: Same content at optimized sizes
    # =======================
    for i, doc in enumerate(documents):
        text = doc.text
        if len(text.strip()) < text_threshold:
            continue

        # Create multiple chunk sizes of the SAME content with adaptive sizing
        # Small chunks
        small_splitter = SentenceSplitter(
            chunk_size=chunk_config["small_chunk_size"],
            chunk_overlap=chunk_config["small_chunk_overlap"]
        )
        small_chunks = small_splitter.get_nodes_from_documents([doc])

        # Medium chunks - same content, larger context
        medium_splitter = SentenceSplitter(
            chunk_size=chunk_config["medium_chunk_size"],
            chunk_overlap=chunk_config["medium_chunk_overlap"]
        )
        medium_chunks = medium_splitter.get_nodes_from_documents([doc])

        # Large chunks - same content, largest context
        large_splitter = SentenceSplitter(
            chunk_size=chunk_config["large_chunk_size"],
            chunk_overlap=chunk_config["large_chunk_overlap"]
        )
        large_chunks = large_splitter.get_nodes_from_documents([doc])

        # Tag each chunk with granularity level and page info
        for node in small_chunks:
            node.metadata["chunk_type"] = "small"
            node.metadata["granularity"] = "detailed"
            node.metadata["page_number"] = i + 1
            node.metadata["source"] = pdf_path

        for node in medium_chunks:
            node.metadata["chunk_type"] = "medium"
            node.metadata["granularity"] = "balanced"
            node.metadata["page_number"] = i + 1
            node.metadata["source"] = pdf_path

        for node in large_chunks:
            node.metadata["chunk_type"] = "large"
            node.metadata["granularity"] = "contextual"
            node.metadata["page_number"] = i + 1
            node.metadata["source"] = pdf_path

        # Add to respective collections
        all_nodes.extend(small_chunks)
        all_nodes.extend(medium_chunks)
        all_nodes.extend(large_chunks)

    # Performance metrics
    chunking_time = time.time() - start_time
    small_count = len([n for n in all_nodes if n.metadata.get('chunk_type') == 'small'])
    medium_count = len([n for n in all_nodes if n.metadata.get('chunk_type') == 'medium'])
    large_count = len([n for n in all_nodes if n.metadata.get('chunk_type') == 'large'])
    
    print(f"✅ Adaptive chunking complete in {chunking_time:.2f}s:")
    print(f"   📏 Small ({chunk_config['small_chunk_size']} chars): {small_count} chunks")
    print(f"   📏 Medium ({chunk_config['medium_chunk_size']} chars): {medium_count} chunks")
    print(f"   📏 Large ({chunk_config['large_chunk_size']} chars): {large_count} chunks")
    print(f"   📊 Total: {len(all_nodes)} chunks ({len(all_nodes)/chunking_time:.1f} chunks/sec)")

    return all_nodes


# Backward compatibility
def multi_granularity_chunking(documents: List[Document], pdf_path: str, text_threshold: int = 100) -> List[TextNode]:
    """Backward compatibility wrapper."""
    return adaptive_multi_granularity_chunking(documents, pdf_path, None, text_threshold)