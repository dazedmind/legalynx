# Enhanced RAG pipeline with hybrid vector + BM25 retrieval
# Focused on vectorized hybrid approach only

from typing import List, Callable, Tuple, Optional
from llama_index.core.schema import NodeWithScore, QueryBundle, TextNode
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.retrievers.bm25 import BM25Retriever
from llama_index.core.retrievers import BaseRetriever, QueryFusionRetriever
from llama_index.core import SimpleDirectoryReader, Document, VectorStoreIndex, StorageContext
from llama_index.vector_stores.faiss import FaissVectorStore
import faiss
from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
import pandas as pd
from .config import rag_config, MODEL_CONFIG, get_adaptive_config


class EnhancedHybridRetriever(BaseRetriever):
    """
    Enhanced hybrid retriever with diversity optimization for multi-question handling.
    Combines vector similarity search with BM25 keyword search using interleaving for better diversity.
    """

    def __init__(self, vector_retriever, bm25_retriever, top_k: int = 50):
        self.vector_retriever = vector_retriever
        self.bm25_retriever = bm25_retriever
        self.top_k = top_k
        super().__init__()

    def _retrieve(self, query_bundle: QueryBundle, **kwargs) -> List[NodeWithScore]:
        """
        Enhanced combination with diversity optimization (important for multi-questions).
        """
        try:
            # Get results from both retrievers
            vector_nodes = self.vector_retriever.retrieve(query_bundle)
            bm25_nodes = self.bm25_retriever.retrieve(query_bundle)

            print(f"🔍 Vector retriever found {len(vector_nodes)} nodes")
            print(f"🔍 BM25 retriever found {len(bm25_nodes)} nodes")

            # Enhanced combination with diversity optimization
            all_nodes = []
            seen_ids = set()

            # Interleave results for better diversity (important for multi-questions)
            max_len = max(len(vector_nodes), len(bm25_nodes))
            for i in range(max_len):
                if i < len(vector_nodes) and vector_nodes[i].node_id not in seen_ids:
                    all_nodes.append(vector_nodes[i])
                    seen_ids.add(vector_nodes[i].node_id)

                if i < len(bm25_nodes) and bm25_nodes[i].node_id not in seen_ids:
                    all_nodes.append(bm25_nodes[i])
                    seen_ids.add(bm25_nodes[i].node_id)

            # Sort by relevance score
            sorted_nodes = sorted(
                all_nodes,
                key=lambda x: x.score if hasattr(x, "score") and x.score else 0.0,
                reverse=True
            )

            print(f"🔗 Combined to {len(sorted_nodes)} unique nodes (retrieving {self.top_k})")

            return sorted_nodes[:self.top_k]

        except Exception as e:
            print(f"❌ Hybrid retrieval failed: {e}")
            # Fallback to BM25 only
            return self.bm25_retriever.retrieve(query_bundle)[:self.top_k]


class RAGPipelineBuilder:
    """
    RAG pipeline builder that uses both vector embeddings and BM25 for hybrid retrieval.
    """
    
    def __init__(self, embedding_manager):
        self.embedding_manager = embedding_manager
        self.llm = embedding_manager.get_llm()

    def build_enhanced_rag_pipeline(self, vector_index: VectorStoreIndex, nodes: List[TextNode],
                                   total_pages: int, num_questions: int = 1) -> Tuple[RetrieverQueryEngine, Callable]:
        """
        Enhanced RAG pipeline that adapts configuration based on:
        - Document size (pages)
        - Query complexity (number of questions)

        Args:
            vector_index: The vector index created from the document
            nodes: List of text nodes for BM25 search
            total_pages: Total pages in the document
            num_questions: Number of questions detected in the query

        Returns:
            Optimized query engine with adaptive retrieval settings
        """
        num_nodes = len(nodes)

        # Get adaptive configuration based on document size and question complexity
        adaptive_config = get_adaptive_config(total_pages, num_questions)
        safe_top_k = min(num_nodes, adaptive_config["retrieval_top_k"])

        print(f"📊 Adaptive Configuration:")
        print(f"   📄 Document: {total_pages} pages, {num_nodes} chunks")
        print(f"   ❓ Questions: {num_questions}")
        print(f"   🔍 Retrieval: {safe_top_k} → Rerank: {adaptive_config['rerank_top_n']}")
        print(f"   💬 Max tokens: {adaptive_config['max_tokens']}")

        # Update LLM token limit based on adaptive configuration
        if hasattr(self.llm, 'update_token_limit'):
            self.llm.update_token_limit(adaptive_config["max_tokens"])

        # Enhanced hybrid retrieval with better diversity
        vector_retriever = vector_index.as_retriever(similarity_top_k=safe_top_k)
        bm25_retriever = BM25Retriever.from_defaults(nodes=nodes, similarity_top_k=safe_top_k)

        # Initialize enhanced hybrid retriever
        hybrid_retriever = EnhancedHybridRetriever(
            vector_retriever=vector_retriever,
            bm25_retriever=bm25_retriever,
            top_k=safe_top_k
        )

        # Enhanced reranker with adaptive top_n
        node_postprocessors = []
        reranker = None
        if num_nodes > 1:
            try:
                rerank_top_n = min(adaptive_config["rerank_top_n"], num_nodes)
                reranker = SentenceTransformerRerank(
                    model=MODEL_CONFIG["rerank_model"],
                    top_n=rerank_top_n
                )
                node_postprocessors.append(reranker)
                print(f"✅ Enhanced Reranker initialized with top_n={rerank_top_n}")
            except Exception as e:
                print(f"⚠️ Reranker initialization failed: {e}")

        # Build final query engine with enhanced components
        query_engine = RetrieverQueryEngine.from_args(
            retriever=hybrid_retriever,
            llm=self.llm,
            node_postprocessors=node_postprocessors
        )

        print(f"✅ Enhanced RAG Pipeline ready!")

        # Enhanced analysis function for debugging
        def analyze_query_results(query_text: str, top_k: int = 8) -> pd.DataFrame:
            """Analyze query results showing both vector and BM25 contributions."""
            query_bundle = QueryBundle(query_str=query_text)
            nodes = hybrid_retriever._retrieve(query_bundle)
            reranked_nodes = reranker.postprocess_nodes(nodes, query_str=query_text) if reranker else nodes

            results = []

            for i, node in enumerate(nodes[:top_k]):
                results.append({
                    "Stage": "Original Retrieval",
                    "Rank": i + 1,
                    "Score": getattr(node, 'score', 0.0),
                    "Content": node.get_text()[:200] + "...",
                    "Page": node.metadata.get("page_number", "Unknown"),
                    "Type": node.metadata.get("chunk_type", "Unknown")
                })

            for i, node in enumerate(reranked_nodes[:top_k]):
                results.append({
                    "Stage": "After Reranking",
                    "Rank": i + 1,
                    "Score": getattr(node, 'score', 0.0),
                    "Content": node.get_text()[:200] + "...",
                    "Page": node.metadata.get("page_number", "Unknown"),
                    "Type": node.metadata.get("chunk_type", "Unknown")
                })

            return pd.DataFrame(results)

        return query_engine, analyze_query_results

    def build_hybrid_rag_pipeline(self, vector_index: VectorStoreIndex, nodes: List[TextNode], total_pages: int = 50, num_questions: int = 1) -> Tuple[RetrieverQueryEngine, Callable]:
        """
        Build an AGGRESSIVE hybrid RAG pipeline using both vector and BM25 retrieval.
        Enhanced to force retrieval of all relevant content for comprehensive responses.
        
        Args:
            vector_index: Vector index for semantic search
            nodes: List of text nodes for BM25 search

        Returns:
            tuple: (query_engine, analysis_function)
        """
        num_nodes = len(nodes)
        adaptive_config = get_adaptive_config(total_pages, num_questions)
        # AGGRESSIVE: Use ALL nodes if document is small enough, otherwise use more than default
        safe_top_k = min(num_nodes, max(adaptive_config["retrieval_top_k"]))
        
        print(f"🔄 Building AGGRESSIVE hybrid RAG pipeline with {num_nodes} nodes")
        print(f"🔄 Using aggressive top_k={safe_top_k} (was {adaptive_config['retrieval_top_k']})")
        
        # Step 1: Create vector retriever with metadata filtering
        print("🔄 Setting up AGGRESSIVE vector retriever...")
        vector_retriever = vector_index.as_retriever(similarity_top_k=safe_top_k)

        # Step 2: Create BM25 retriever
        print("🔄 Setting up AGGRESSIVE BM25 retriever...")
        bm25_retriever = BM25Retriever.from_defaults(
            nodes=nodes, 
            similarity_top_k=safe_top_k
        )
        
        # Step 3: Create AGGRESSIVE hybrid retriever
        print("🔄 Combining vector and BM25 retrievers with AGGRESSIVE mode...")
        hybrid_retriever = EnhancedHybridRetriever(
            vector_retriever=vector_retriever,
            bm25_retriever=bm25_retriever,
            top_k=safe_top_k
        )
        
        # Step 4: Setup AGGRESSIVE reranker with more results
        node_postprocessors = []
        reranker = None
        if num_nodes > 1:
            try:
                # AGGRESSIVE: Use more results for reranking
                rerank_top_n = min(max(adaptive_config["rerank_top_n"]), num_nodes)
                reranker = SentenceTransformerRerank(
                    model=MODEL_CONFIG["rerank_model"],
                    top_n=rerank_top_n
                )
                node_postprocessors.append(reranker)
                print(f"✅ AGGRESSIVE Reranker initialized with top_n={rerank_top_n}")
            except Exception as e:
                print(f"⚠️ Reranker initialization failed: {e}")
        
    
    
        # Step 6: Create final query engine
        query_engine = RetrieverQueryEngine.from_args(
            retriever=hybrid_retriever,
            llm=self.llm,
            node_postprocessors=node_postprocessors
        )
        
        print(f"✅ AGGRESSIVE RAG Pipeline built successfully with {num_nodes} nodes")
        print(f"✅ Using: Vector + BM25 → Rerank (retrieving {safe_top_k} chunks)")
        
        # Enhanced analysis function for debugging and comparison (shows MORE results)
        def analyze_query_results(query_text: str, top_k: int = 8) -> pd.DataFrame:  # Show more results
            """
            Analyze query results showing both vector and BM25 contributions.
            """
            query_bundle = QueryBundle(query_str=query_text)
            reranked_nodes = reranker.postprocess_nodes(nodes, query_str=query_text) if reranker else nodes
            nodes = hybrid_retriever._retrieve(query_bundle)
            
            results = []
            
            for i, node in enumerate(nodes[:top_k]):
                results.append({
                    "Stage": "Original Retrieval",
                    "Rank": i + 1,
                    "Score": getattr(node, 'score', 0.0),
                    "Content": node.get_text()[:200] + "...",  # Show more content
                    "Page": node.metadata.get("page_number", "Unknown"),
                    "Type": node.metadata.get("chunk_type", "Unknown")
                })
            
            for i, node in enumerate(reranked_nodes[:top_k]):
                results.append({
                    "Stage": "After Reranking",
                    "Rank": i + 1,
                    "Score": getattr(node, 'score', 0.0),
                    "Content": node.get_text()[:200] + "...",  # Show more content
                    "Page": node.metadata.get("page_number", "Unknown"),
                    "Type": node.metadata.get("chunk_type", "Unknown")
                })

            results_df = pd.DataFrame(results)
            return (results_df)
        
        return query_engine, analyze_query_results


def build_vectorized_rag_system(vector_index: VectorStoreIndex, nodes: List[TextNode], embedding_manager) -> dict:
    """
    Build a complete vectorized RAG system with hybrid retrieval.
    
    Args:
        vector_index: Vector index for semantic search
        nodes: List of text nodes for BM25 search
        embedding_manager: Embedding manager (for LLM)
        
    Returns:
        dict: Complete RAG system components
    """
    print("🔄 Building complete vectorized RAG system...")
    
    # Build hybrid pipeline
    pipeline_builder = RAGPipelineBuilder(embedding_manager)
    query_engine, analyzer = pipeline_builder.build_hybrid_rag_pipeline(vector_index, nodes)
    
    # Create performance monitor
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
        "retrieval_type": "hybrid_vector_bm25",
        "vector_index": vector_index
    }


# Simple function to create nodes from documents
def create_simple_nodes_from_documents(documents: List[Document]) -> List[TextNode]:
    """
    Create simple text nodes from documents for vectorized processing.
    
    Args:
        documents: List of documents
        
    Returns:
        List[TextNode]: Simple text nodes optimized for hybrid retrieval
    """
    nodes = []
    
    for doc_idx, document in enumerate(documents):
        # Simple text chunking (split by paragraphs or sentences)
        text = document.text
        
        # Split into chunks
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
        
        # Create nodes optimized for vectorization
        for chunk_idx, chunk in enumerate(chunks):
            if chunk.strip():  # Only add non-empty chunks
                node = TextNode(
                    text=chunk,
                    metadata={
                        "document_id": doc_idx,
                        "chunk_id": chunk_idx,
                        "chunk_type": "fine",  # Set as fine for vector filtering
                        "page_number": doc_idx + 1,
                        "source": document.metadata.get("source", "unknown")
                    }
                )
                nodes.append(node)
    
    print(f"✅ Created {len(nodes)} vectorized text nodes from {len(documents)} documents")
    return nodes


def create_vector_workflow(file_content: bytes, original_filename: str, **kwargs):
    """
    Complete vectorized workflow that replaces the old BM25-only approach.
    
    Args:
        file_content: PDF file content
        original_filename: Original filename
        **kwargs: Additional arguments
        
    Returns:
        dict: RAG system components with vector capabilities
    """
    import time
    from .embedder import EmbeddingManager
    from llama_index.core import Document, VectorStoreIndex
    
    start_time = time.time()
    timing = {}
    
    # Step 1: Load documents (simplified)
    load_start = time.time()
    # Create a simple document from the file content
    documents = [Document(text=file_content.decode('utf-8', errors='ignore'), metadata={"source": original_filename})]
    timing["document_loading"] = time.time() - load_start
    
    # Step 2: Create nodes optimized for vectorization
    chunk_start = time.time()
    nodes = create_simple_nodes_from_documents(documents)
    timing["chunking"] = time.time() - chunk_start
    
    # Step 3: Initialize embedding manager
    embed_start = time.time()
    embedding_manager = EmbeddingManager()
    timing["embedding_init"] = time.time() - embed_start
    
    # Step 4: Build FAISS vector index
    vector_start = time.time()
    embed_model = embedding_manager.get_embedding_model()
    test_embedding = embed_model.get_text_embedding("test")
    dimension = len(test_embedding)

    faiss_index = faiss.IndexFlatL2(dimension)
    vector_store = FaissVectorStore(faiss_index=faiss_index)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)

    vector_index = VectorStoreIndex(nodes, storage_context=storage_context, embed_model=embed_model)
    timing["vector_indexing"] = time.time() - vector_start
    
    # Step 5: Build vectorized RAG system
    rag_start = time.time()
    rag_system = build_vectorized_rag_system(vector_index, nodes, embedding_manager)
    timing["rag_building"] = time.time() - rag_start
    
    # Step 6: Generate filename (use your existing naming logic)
    naming_start = time.time()
    # Use your RuleBasedFileNamer here
    filename = original_filename  # Simplified for now
    timing["naming"] = time.time() - naming_start
    
    total_time = time.time() - start_time
    timing["total"] = total_time
    
    print(f"✅ Vectorized workflow completed in {total_time:.2f}s")
    
    return {
        "rag_system": rag_system,
        "documents": documents,
        "filename": filename,
        "file_path": f"temp_{filename}",
        "timing": timing,
        "processing_type": "vectorized_hybrid"
    }


def analyze_and_process_query(query_text: str, vector_index: VectorStoreIndex, nodes: List[TextNode],
                               embedding_manager, total_pages: int):
    """
    Analyze query complexity and process with appropriate RAG configuration.

    Args:
        query_text: The user's query
        vector_index: Vector index of the document
        nodes: List of text nodes for BM25 search
        embedding_manager: Embedding manager instance
        total_pages: Total pages in the document

    Returns:
        Processed response from the adaptive RAG system
    """
    # Simple but effective question detection
    question_count = max(query_text.count("?"), 1)  # At least 1 question

    print(f"🔍 Query Analysis: {question_count} question(s) detected")

    # Create adaptive RAG engine based on analysis
    pipeline_builder = RAGPipelineBuilder(embedding_manager)
    rag_engine, _ = pipeline_builder.build_enhanced_rag_pipeline(
        vector_index, nodes, total_pages, question_count
    )

    # Process the query (single comprehensive processing works well for multi-questions with enhanced retrieval)
    response = rag_engine.query(query_text.strip()).response

    return response