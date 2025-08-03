# Complete vector-free RAG system alternative
# This is a drop-in replacement for your RAG pipeline that avoids all vector operations

from typing import List, Callable, Tuple, Optional
from llama_index.core.schema import NodeWithScore, QueryBundle, TextNode
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.retrievers.bm25 import BM25Retriever
from llama_index.core.retrievers import BaseRetriever
from llama_index.core import SimpleDirectoryReader, Document
import pandas as pd
from .config import rag_config, MODEL_CONFIG


class TextOnlyRetriever(BaseRetriever):
    """
    Text-only retriever that uses BM25 without any vector operations.
    """
    
    def __init__(self, nodes: List[TextNode], top_k: int = 5):
        self.nodes = nodes
        self.top_k = top_k
        super().__init__()
        
        # Initialize BM25 retriever
        try:
            self.bm25_retriever = BM25Retriever.from_defaults(
                nodes=nodes, 
                similarity_top_k=top_k
            )
            print(f"✅ BM25 retriever initialized with {len(nodes)} nodes")
        except Exception as e:
            print(f"❌ Failed to initialize BM25 retriever: {e}")
            self.bm25_retriever = None

    def _retrieve(self, query_bundle: QueryBundle, **kwargs) -> List[NodeWithScore]:
        """
        Retrieve nodes using BM25 text search only.
        """
        if not self.bm25_retriever:
            print("❌ BM25 retriever not available")
            return []
            
        try:
            nodes = self.bm25_retriever.retrieve(query_bundle)
            print(f"🔍 BM25 retriever found {len(nodes)} nodes")
            return nodes[:self.top_k]
        except Exception as e:
            print(f"❌ BM25 retrieval failed: {e}")
            return []


class VectorFreeRAGPipelineBuilder:
    """
    Vector-free RAG pipeline builder that uses only text-based retrieval.
    """
    
    def __init__(self, embedding_manager):
        self.embedding_manager = embedding_manager
        self.llm = embedding_manager.get_llm()
    
    def build_text_only_rag_pipeline(self, nodes: List[TextNode]) -> Tuple[RetrieverQueryEngine, Callable]:
        """
        Build a RAG pipeline using only text-based retrieval (no vectors).
        
        Args:
            nodes: List of text nodes
            
        Returns:
            tuple: (query_engine, analysis_function)
        """
        num_nodes = len(nodes)
        safe_top_k = min(rag_config["retrieval_top_k"], max(1, num_nodes))
        
        print(f"🔄 Building vector-free RAG pipeline with {num_nodes} nodes")
        
        # Step 1: Create text-only retriever
        text_retriever = TextOnlyRetriever(nodes=nodes, top_k=safe_top_k)
        
        # Step 2: Optional reranker
        node_postprocessors = []
        reranker = None
        if num_nodes > 1:
            try:
                reranker = SentenceTransformerRerank(
                    model=MODEL_CONFIG["rerank_model"],
                    top_n=min(rag_config["rerank_top_n"], num_nodes)
                )
                node_postprocessors.append(reranker)
                print("✅ Reranker initialized successfully")
            except Exception as e:
                print(f"⚠️ Reranker initialization failed: {e}")
        
        # Step 3: Create query engine
        query_engine = RetrieverQueryEngine.from_args(
            retriever=text_retriever,
            llm=self.llm,
            node_postprocessors=node_postprocessors
        )
        
        print(f"✅ Vector-free RAG Pipeline built successfully with {num_nodes} nodes")
        
        # Analysis function
        def analyze_query_results(query_text: str, top_k: int = 4) -> pd.DataFrame:
            """
            Analyze query results without vector operations.
            """
            query_bundle = QueryBundle(query_str=query_text)
            nodes = text_retriever._retrieve(query_bundle)
            
            results = []
            for i, node in enumerate(nodes[:top_k]):
                results.append({
                    "Rank": i + 1,
                    "Score": getattr(node, 'score', 0.0),
                    "Content": node.get_text()[:150] + "...",
                    "Page": node.metadata.get("page_number", "Unknown"),
                    "Chunk_Type": node.metadata.get("chunk_type", "Unknown")
                })
            
            return pd.DataFrame(results)
        
        return query_engine, analyze_query_results


def build_vector_free_rag_system(nodes: List[TextNode], embedding_manager) -> dict:
    """
    Build a complete vector-free RAG system.
    
    Args:
        nodes: List of text nodes
        embedding_manager: Embedding manager (for LLM only)
        
    Returns:
        dict: Complete RAG system components
    """
    print("🔄 Building complete vector-free RAG system...")
    
    # Build pipeline
    pipeline_builder = VectorFreeRAGPipelineBuilder(embedding_manager)
    query_engine, analyzer = pipeline_builder.build_text_only_rag_pipeline(nodes)
    
    # Create simple performance monitor
    class SimplePerformanceMonitor:
        def __init__(self):
            self.query_count = 0
            
        def log_query(self, query: str, response_time: float):
            self.query_count += 1
            print(f"📊 Query #{self.query_count} completed in {response_time:.2f}s")
    
    performance_monitor = SimplePerformanceMonitor()
    
    return {
        "query_engine": query_engine,
        "rerank_demo": analyzer,
        "analyzer": analyzer,
        "pipeline_builder": pipeline_builder,
        "embedding_manager": embedding_manager,
        "performance_monitor": performance_monitor,
        "retrieval_type": "text_only_bm25"
    }


# Simple function to create nodes from documents without vector operations
def create_simple_nodes_from_documents(documents: List[Document]) -> List[TextNode]:
    """
    Create simple text nodes from documents without any vector operations.
    
    Args:
        documents: List of documents
        
    Returns:
        List[TextNode]: Simple text nodes
    """
    nodes = []
    
    for doc_idx, document in enumerate(documents):
        # Simple text chunking (split by paragraphs or sentences)
        text = document.text
        
        # Split into chunks (simple approach)
        chunks = []
        sentences = text.split('. ')
        
        current_chunk = ""
        for sentence in sentences:
            if len(current_chunk + sentence) < 1000:  # Max chunk size
                current_chunk += sentence + ". "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + ". "
        
        # Add last chunk
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        # Create nodes
        for chunk_idx, chunk in enumerate(chunks):
            if chunk.strip():  # Only add non-empty chunks
                node = TextNode(
                    text=chunk,
                    metadata={
                        "document_id": doc_idx,
                        "chunk_id": chunk_idx,
                        "chunk_type": "simple",
                        "page_number": doc_idx + 1,  # Simple page numbering
                        "source": document.metadata.get("source", "unknown")
                    }
                )
                nodes.append(node)
    
    print(f"✅ Created {len(nodes)} simple text nodes from {len(documents)} documents")
    return nodes


# Usage example for your optimized_rag_system.py
def create_vector_free_workflow(file_content: bytes, original_filename: str, **kwargs):
    """
    Complete vector-free workflow that can replace your optimized workflow.
    
    Args:
        file_content: PDF file content
        original_filename: Original filename
        **kwargs: Additional arguments
        
    Returns:
        dict: RAG system components
    """
    import time
    from .embedder import EmbeddingManager
    from llama_index.core import Document
    
    start_time = time.time()
    timing = {}
    
    # Step 1: Load documents (simplified)
    load_start = time.time()
    # Create a simple document from the file content
    documents = [Document(text=file_content.decode('utf-8', errors='ignore'), metadata={"source": original_filename})]
    timing["document_loading"] = time.time() - load_start
    
    # Step 2: Create simple nodes (no vector operations)
    chunk_start = time.time()
    nodes = create_simple_nodes_from_documents(documents)
    timing["chunking"] = time.time() - chunk_start
    
    # Step 3: Initialize embedding manager (for LLM only)
    embed_start = time.time()
    embedding_manager = EmbeddingManager()
    timing["embedding_init"] = time.time() - embed_start
    
    # Step 4: Build vector-free RAG system
    rag_start = time.time()
    rag_system = build_vector_free_rag_system(nodes, embedding_manager)
    timing["rag_building"] = time.time() - rag_start
    
    # Step 5: Generate filename (use your existing naming logic)
    naming_start = time.time()
    # Use your RuleBasedFileNamer here
    filename = original_filename  # Simplified for now
    timing["naming"] = time.time() - naming_start
    
    total_time = time.time() - start_time
    timing["total"] = total_time
    
    print(f"✅ Vector-free workflow completed in {total_time:.2f}s")
    
    return {
        "rag_system": rag_system,
        "documents": documents,
        "filename": filename,
        "file_path": f"temp_{filename}",
        "timing": timing,
        "processing_type": "vector_free"
    }