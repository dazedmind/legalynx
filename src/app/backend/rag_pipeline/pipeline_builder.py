import pandas as pd
from typing import List, Callable, Tuple, Optional
from llama_index.core import VectorStoreIndex
from llama_index.core.schema import NodeWithScore, QueryBundle
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.retrievers.bm25 import BM25Retriever
from llama_index.core.retrievers import BaseRetriever, QueryFusionRetriever
from llama_index.core.vector_stores import MetadataFilters, ExactMatchFilter
from .config import rag_config, MODEL_CONFIG
from .embedder import EmbeddingManager


class HybridRetriever(BaseRetriever):
    """
    Hybrid retriever that combines vector search, BM25, and page-level retrieval.
    """
    
    def __init__(self, vector_retriever, bm25_retriever, page_retriever, top_k: int):
        self.vector_retriever = vector_retriever
        self.bm25_retriever = bm25_retriever
        self.page_retriever = page_retriever
        self.top_k = top_k
        super().__init__()

    def _retrieve(self, query_bundle: QueryBundle, **kwargs) -> List[NodeWithScore]:
        """
        Retrieve nodes using hybrid approach combining multiple retrieval methods.
        """
        vector_nodes = self.vector_retriever.retrieve(query_bundle)
        bm25_nodes = self.bm25_retriever.retrieve(query_bundle)
        page_nodes = self.page_retriever.retrieve(query_bundle)

        # Combine all retrieved nodes
        all_nodes = list(vector_nodes) + list(bm25_nodes) + list(page_nodes)

        # Remove duplicates by node_id
        unique_nodes = {}
        for node in all_nodes:
            if node.node_id not in unique_nodes:
                unique_nodes[node.node_id] = node

        # Sort nodes by score, highest first
        sorted_nodes = sorted(
            unique_nodes.values(),
            key=lambda x: x.score if hasattr(x, "score") and x.score else 0.0,
            reverse=True
        )

        # Return top_k results
        return sorted_nodes[:self.top_k]


class RAGPipelineBuilder:
    """
    Builder class for creating complete RAG pipelines with hybrid retrieval and reranking.
    """
    
    def __init__(self, embedding_manager: EmbeddingManager):
        """
        Initialize the pipeline builder.
        
        Args:
            embedding_manager: Configured embedding manager
        """
        self.embedding_manager = embedding_manager
        self.llm = embedding_manager.get_llm()
    
    def build_rag_pipeline(self, index: VectorStoreIndex) -> Tuple[RetrieverQueryEngine, Callable]:
        """
        Build a complete RAG pipeline with hybrid retrieval, query expansion, and reranking.
        
        Args:
            index: Vector index to build pipeline from
            
        Returns:
            tuple: (query_engine, reranking_demo_function)
        """
        # Get all nodes from the index's docstore
        nodes = list(index.docstore.docs.values())
        num_nodes = len(nodes)

        # Set top_k based on configuration
        safe_top_k = min(rag_config["retrieval_top_k"], max(1, num_nodes))
        print(f"Index contains {num_nodes} nodes, using top_k={safe_top_k}")

        # Step 1: Define Filters for Each Retrieval Method
        filter_by_fine_type = MetadataFilters(
            filters=[ExactMatchFilter(key="chunk_type", value="fine")]
        )
        filter_by_coarse_type = MetadataFilters(
            filters=[ExactMatchFilter(key="chunk_type", value="coarse")]
        )
        filter_by_page_level = MetadataFilters(
            filters=[ExactMatchFilter(key="chunk_type", value="page")]
        )

        # Step 2: Create Individual Retrievers
        vector_retriever = index.as_retriever(
            similarity_top_k=safe_top_k, 
            filters=filter_by_fine_type
        )
        bm25_retriever = BM25Retriever.from_defaults(
            nodes=nodes, 
            similarity_top_k=safe_top_k
        )
        page_retriever = index.as_retriever(
            similarity_top_k=safe_top_k, 
            filters=filter_by_page_level
        )

        # Step 3: Hybrid Retriever for Combining Methods
        hybrid_retriever = HybridRetriever(
            vector_retriever=vector_retriever,
            bm25_retriever=bm25_retriever,
            page_retriever=page_retriever,
            top_k=safe_top_k
        )

        # Step 4: Reranker (Optional)
        node_postprocessors = []
        reranker = None
        if num_nodes > 1:
            reranker = SentenceTransformerRerank(
                model=MODEL_CONFIG["rerank_model"],
                top_n=min(rag_config["rerank_top_n"], num_nodes)
            )
            node_postprocessors.append(reranker)

        # Step 5: Query Expansion with Fusion Retriever
        fusion_retriever = QueryFusionRetriever(
            retrievers=[hybrid_retriever],
            llm=self.llm,
            num_queries=rag_config["num_query_expansions"],
            similarity_top_k=safe_top_k
        )
    
        # Step 6: Final Query Engine
        query_engine = RetrieverQueryEngine.from_args(
            retriever=fusion_retriever,
            llm=self.llm,
            node_postprocessors=node_postprocessors
        )

        print(f"✅ Hybrid RAG Pipeline built successfully with {num_nodes} nodes.")

        # Create reranking demonstration function
        def run_query_with_reranking(query_text: str, top_k: int = 4) -> pd.DataFrame:
            """
            Run a query and show the effect of reranking for analysis.
            
            Args:
                query_text: Query to execute
                top_k: Number of top results to show
                
            Returns:
                DataFrame showing retrieval and reranking results
            """
            query_bundle = QueryBundle(query_str=query_text)
            nodes = hybrid_retriever._retrieve(query_bundle)
            
            # Apply reranking if available
            if reranker:
                reranked_nodes = reranker.postprocess_nodes(nodes, query_str=query_text)
            else:
                reranked_nodes = nodes

            # Prepare DataFrame for comparison
            results = []

            # Original retrieval results
            for i, node in enumerate(nodes[:top_k]):
                results.append({
                    "Stage": "Original Retrieval",
                    "Rank": i + 1,
                    "Score": getattr(node, 'score', 0.0),
                    "Content": node.get_text()[:150] + "...",
                    "Page": node.metadata.get("page_number", "Unknown"),
                    "Chunk_Type": node.metadata.get("chunk_type", "Unknown")
                })

            # Reranked results
            for i, node in enumerate(reranked_nodes[:top_k]):
                results.append({
                    "Stage": "After Reranking",
                    "Rank": i + 1,
                    "Score": getattr(node, 'score', 0.0),
                    "Content": node.get_text()[:150] + "...",
                    "Page": node.metadata.get("page_number", "Unknown"),
                    "Chunk_Type": node.metadata.get("chunk_type", "Unknown")
                })

            return pd.DataFrame(results)

        return query_engine, run_query_with_reranking
    
    def create_simple_query_engine(self, index: VectorStoreIndex) -> RetrieverQueryEngine:
        """
        Create a simple query engine without hybrid retrieval for basic use cases.
        
        Args:
            index: Vector index to build pipeline from
            
        Returns:
            RetrieverQueryEngine: Simple query engine
        """
        retriever = index.as_retriever(similarity_top_k=rag_config["retrieval_top_k"])
        
        query_engine = RetrieverQueryEngine.from_args(
            retriever=retriever,
            llm=self.llm
        )
        
        print("✅ Simple RAG Pipeline built successfully.")
        return query_engine
    
    def add_custom_postprocessors(self, query_engine: RetrieverQueryEngine, 
                                 postprocessors: List) -> RetrieverQueryEngine:
        """
        Add custom postprocessors to an existing query engine.
        
        Args:
            query_engine: Existing query engine
            postprocessors: List of postprocessors to add
            
        Returns:
            RetrieverQueryEngine: Updated query engine
        """
        # This would require rebuilding the query engine with new postprocessors
        # For now, return the original query engine
        return query_engine


class QueryAnalyzer:
    """
    Analyzer for understanding query performance and retrieval quality.
    """
    
    def __init__(self, query_engine: RetrieverQueryEngine, 
                 hybrid_retriever: Optional[HybridRetriever] = None):
        """
        Initialize the query analyzer.
        
        Args:
            query_engine: Query engine to analyze
            hybrid_retriever: Optional hybrid retriever for detailed analysis
        """
        self.query_engine = query_engine
        self.hybrid_retriever = hybrid_retriever
    
    def analyze_query(self, query_text: str, show_retrieved_content: bool = True) -> dict:
        """
        Analyze a query and return detailed information about retrieval and generation.
        
        Args:
            query_text: Query to analyze
            show_retrieved_content: Whether to include full retrieved content
            
        Returns:
            dict: Analysis results
        """
        # Execute query
        response = self.query_engine.query(query_text)
        
        # Get source nodes
        source_nodes = response.source_nodes if hasattr(response, 'source_nodes') else []
        
        analysis = {
            "query": query_text,
            "response": str(response),
            "num_source_nodes": len(source_nodes),
            "source_analysis": []
        }
        
        # Analyze each source node
        for i, node in enumerate(source_nodes):
            node_analysis = {
                "rank": i + 1,
                "score": getattr(node, 'score', 0.0),
                "page_number": node.metadata.get("page_number", "Unknown"),
                "chunk_type": node.metadata.get("chunk_type", "Unknown"),
                "content_length": len(node.get_text()),
                "content_preview": node.get_text()[:200] + "..." if len(node.get_text()) > 200 else node.get_text()
            }
            
            if show_retrieved_content:
                node_analysis["full_content"] = node.get_text()
            
            analysis["source_analysis"].append(node_analysis)
        
        return analysis
    
    def compare_queries(self, queries: List[str]) -> pd.DataFrame:
        """
        Compare multiple queries and their retrieval performance.
        
        Args:
            queries: List of queries to compare
            
        Returns:
            DataFrame: Comparison results
        """
        results = []
        
        for query in queries:
            analysis = self.analyze_query(query, show_retrieved_content=False)
            
            # Average score of retrieved nodes
            avg_score = 0
            if analysis["source_analysis"]:
                avg_score = sum(node["score"] for node in analysis["source_analysis"]) / len(analysis["source_analysis"])
            
            results.append({
                "Query": query,
                "Response_Length": len(analysis["response"]),
                "Num_Sources": analysis["num_source_nodes"],
                "Avg_Retrieval_Score": avg_score,
                "Response_Preview": analysis["response"][:100] + "..."
            })
        
        return pd.DataFrame(results)


class PerformanceMonitor:
    """
    Monitor and log performance metrics for the RAG pipeline.
    """
    
    def __init__(self):
        self.query_history = []
        self.performance_metrics = {}
    
    def log_query(self, query: str, response_time: float, tokens_used: Optional[int] = None):
        """
        Log a query execution with performance metrics.
        
        Args:
            query: The executed query
            response_time: Time taken to execute the query
            tokens_used: Number of tokens used (if available)
        """
        self.query_history.append({
            "query": query,
            "response_time": response_time,
            "tokens_used": tokens_used,
            "timestamp": pd.Timestamp.now()
        })
    
    def get_performance_summary(self) -> dict:
        """
        Get a summary of performance metrics.
        
        Returns:
            dict: Performance summary
        """
        if not self.query_history:
            return {"message": "No queries executed yet"}
        
        df = pd.DataFrame(self.query_history)
        
        return {
            "total_queries": len(self.query_history),
            "avg_response_time": df["response_time"].mean(),
            "max_response_time": df["response_time"].max(),
            "min_response_time": df["response_time"].min(),
            "recent_queries": len(df[df["timestamp"] > pd.Timestamp.now() - pd.Timedelta(hours=1)])
        }


def build_complete_rag_system(index: VectorStoreIndex, 
                             embedding_manager: EmbeddingManager) -> dict:
    """
    Build a complete RAG system with all components.
    
    Args:
        index: Vector index
        embedding_manager: Embedding manager
        
    Returns:
        dict: Complete RAG system components
    """
    # Build pipeline
    pipeline_builder = RAGPipelineBuilder(embedding_manager)
    query_engine, rerank_demo = pipeline_builder.build_rag_pipeline(index)
    
    # Create analyzer
    analyzer = QueryAnalyzer(query_engine)
    
    # Create performance monitor
    performance_monitor = PerformanceMonitor()
    
    # Return all components
    return {
        "query_engine": query_engine,
        "rerank_demo": rerank_demo,
        "analyzer": analyzer,
        "pipeline_builder": pipeline_builder,
        "embedding_manager": embedding_manager,
        "performance_monitor": performance_monitor
    }


def create_custom_retriever(index: VectorStoreIndex, retrieval_strategy: str = "hybrid") -> BaseRetriever:
    """
    Create a custom retriever based on the specified strategy.
    
    Args:
        index: Vector index
        retrieval_strategy: Strategy to use ("vector", "bm25", "hybrid", "page")
        
    Returns:
        BaseRetriever: Configured retriever
    """
    nodes = list(index.docstore.docs.values())
    safe_top_k = min(rag_config["retrieval_top_k"], max(1, len(nodes)))
    
    if retrieval_strategy == "vector":
        return index.as_retriever(similarity_top_k=safe_top_k)
    
    elif retrieval_strategy == "bm25":
        return BM25Retriever.from_defaults(nodes=nodes, similarity_top_k=safe_top_k)
    
    elif retrieval_strategy == "page":
        filter_by_page_level = MetadataFilters(
            filters=[ExactMatchFilter(key="chunk_type", value="page")]
        )
        return index.as_retriever(similarity_top_k=safe_top_k, filters=filter_by_page_level)
    
    elif retrieval_strategy == "hybrid":
        # Create individual retrievers
        vector_retriever = index.as_retriever(similarity_top_k=safe_top_k)
        bm25_retriever = BM25Retriever.from_defaults(nodes=nodes, similarity_top_k=safe_top_k)
        page_retriever = index.as_retriever(
            similarity_top_k=safe_top_k,
            filters=MetadataFilters(filters=[ExactMatchFilter(key="chunk_type", value="page")])
        )
        
        return HybridRetriever(
            vector_retriever=vector_retriever,
            bm25_retriever=bm25_retriever,
            page_retriever=page_retriever,
            top_k=safe_top_k
        )
    
    else:
        raise ValueError(f"Unknown retrieval strategy: {retrieval_strategy}")


def optimize_pipeline_for_document_type(index: VectorStoreIndex, 
                                       document_type: str = "mortgage") -> dict:
    """
    Optimize the RAG pipeline based on the document type.
    
    Args:
        index: Vector index
        document_type: Type of document ("mortgage", "legal", "technical", "general")
        
    Returns:
        dict: Optimized pipeline configuration
    """
    # Document-specific optimizations
    optimizations = {
        "mortgage": {
            "fine_chunk_size": 200,
            "coarse_chunk_size": 800,
            "retrieval_top_k": 6,
            "rerank_top_n": 3,
            "focus_sections": ["PAYMENT", "FEES", "TERMS", "CONDITIONS"]
        },
        "legal": {
            "fine_chunk_size": 300,
            "coarse_chunk_size": 1200,
            "retrieval_top_k": 8,
            "rerank_top_n": 4,
            "focus_sections": ["DEFINITIONS", "OBLIGATIONS", "RIGHTS", "REMEDIES"]
        },
        "technical": {
            "fine_chunk_size": 256,
            "coarse_chunk_size": 1024,
            "retrieval_top_k": 5,
            "rerank_top_n": 2,
            "focus_sections": ["SPECIFICATIONS", "PROCEDURES", "REQUIREMENTS"]
        },
        "general": {
            "fine_chunk_size": 256,
            "coarse_chunk_size": 1024,
            "retrieval_top_k": 4,
            "rerank_top_n": 2,
            "focus_sections": []
        }
    }
    
    return optimizations.get(document_type, optimizations["general"])