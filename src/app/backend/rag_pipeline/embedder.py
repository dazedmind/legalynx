import os
from typing import List
from llama_index.core import VectorStoreIndex, Settings
from llama_index.core.schema import TextNode
from llama_index.llms.google_genai import GoogleGenAI
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from rag_pipeline.config import MODEL_CONFIG, SYSTEM_PROMPT


class EmbeddingManager:
    """
    Manages the embedding model and LLM configuration for the RAG pipeline.
    """
    
    def __init__(self):
        """
        Initialize the embedding manager with LLM and embedding models.
        
        Args:
            google_api_key: Google API key for LLM
        """
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        self.embed_model = None
        self.llm = None
        self._setup_models()
    
    def _setup_models(self):
        """
        Setup the embedding model and LLM.
        """
        # Initialize the HuggingFace embedding model
        print("🔄 Initializing embedding model...")
        self.embed_model = HuggingFaceEmbedding(
            model_name=MODEL_CONFIG["embedding_model"]
        )
        Settings.embed_model = self.embed_model
        print(f"✅ Embedding model loaded: {MODEL_CONFIG['embedding_model']}")
        
        # Validate API key
        if not self.google_api_key:
            raise ValueError("❌ GOOGLE_API_KEY not found! Please set GOOGLE_API_KEY environment variable.")
        
        # print(f"🔑 Using Google API key: {self.google_api_key[:20]}...")
        
        # Initialize the Google LLM
        try:
            print("🔄 Initializing Google LLM...")
            self.llm = GoogleGenAI(
                model=MODEL_CONFIG["llm_model"],
                api_key=self.google_api_key
            )
            
            # Test the LLM with a simple call
            print("🧪 Testing Google LLM connection...")
            test_response = self.llm.complete("Hello")
            print(f"✅ LLM test successful: {str(test_response)[:50]}...")
            
        except Exception as e:
            print(f"❌ LLM initialization failed: {e}")
            # print(f"   API key used: {self.google_api_key[:20]}...")
            print(f"   Model: {MODEL_CONFIG['llm_model']}")
            raise
        
        print(f"✅ Initialized LLM: {MODEL_CONFIG['llm_model']} (Google)")
    
    def get_embedding_model(self):
        """
        Returns the embedding model.
        """
        return self.embed_model
    
    def get_llm(self):
        """
        Returns the LLM.
        """
        return self.llm


class IndexBuilder:
    """
    Builds and manages vector indices for the RAG pipeline.
    """
    
    def __init__(self, embedding_manager: EmbeddingManager):
        """
        Initialize the index builder.
        
        Args:
            embedding_manager: Configured embedding manager
        """
        self.embedding_manager = embedding_manager
    
    def build_vector_index(self, nodes: List[TextNode]) -> VectorStoreIndex:
        """
        Build a vector index from the provided nodes.
        
        Args:
            nodes: List of text nodes to index
            
        Returns:
            VectorStoreIndex: The built vector index
        """
        if not nodes:
            raise ValueError("No nodes provided for indexing")
        
        print(f"🔄 Building vector index with {len(nodes)} nodes...")
        
        # Create vector index
        vector_index = VectorStoreIndex(nodes)
        print(f"✅ Indexed {len(nodes)} nodes in vector store")
        
        return vector_index
    
    def update_index(self, index: VectorStoreIndex, new_nodes: List[TextNode]) -> VectorStoreIndex:
        """
        Update an existing index with new nodes.
        
        Args:
            index: Existing vector index
            new_nodes: New nodes to add
            
        Returns:
            VectorStoreIndex: Updated index
        """
        # Use the correct method to insert nodes
        for node in new_nodes:
            index.docstore.add_documents([node])
        
        print(f"✅ Added {len(new_nodes)} new nodes to existing index")
        return index
    
    def get_index_stats(self, index: VectorStoreIndex) -> dict:
        """
        Get statistics about the index.
        
        Args:
            index: Vector index to analyze
            
        Returns:
            dict: Index statistics
        """
        nodes = list(index.docstore.docs.values())
        
        # Count nodes by type
        chunk_types = {}
        page_numbers = {}
        
        for node in nodes:
            chunk_type = node.metadata.get("chunk_type", "unknown")
            page_num = node.metadata.get("page_number", "unknown")
            
            chunk_types[chunk_type] = chunk_types.get(chunk_type, 0) + 1
            page_numbers[page_num] = page_numbers.get(page_num, 0) + 1
        
        stats = {
            "total_nodes": len(nodes),
            "chunk_types": chunk_types,
            "pages": len(page_numbers),
            "page_distribution": page_numbers
        }
        
        return stats
    
    def save_index(self, index: VectorStoreIndex, save_path: str):
        """
        Save the index to disk.
        
        Args:
            index: Vector index to save
            save_path: Path to save the index
        """
        index.storage_context.persist(persist_dir=save_path)
        print(f"✅ Index saved to {save_path}")
    
    def load_index(self, load_path: str):
        """
        Load an index from disk.
        
        Args:
            load_path: Path to load the index from
            
        Returns:
            The loaded index
        """
        from llama_index.core import StorageContext, load_index_from_storage
        
        storage_context = StorageContext.from_defaults(persist_dir=load_path)
        index = load_index_from_storage(storage_context)
        
        print(f"✅ Index loaded from {load_path}")
        return index


def create_index_from_documents(documents, pdf_path: str) -> tuple:
    """
    Create a complete index from documents including chunking and embedding.
    
    Args:
        documents: List of Document objects
        pdf_path: Path to the source PDF
        google_api_key: Google API key for LLM
        
    Returns:
        tuple: (VectorStoreIndex, EmbeddingManager)
    """
    from rag_pipeline.chunking import multi_granularity_chunking
    
    print(f"🔄 Creating index from documents...")
    api_key = os.getenv('GOOGLE_API_KEY')
    
    # Initialize embedding manager
    embedding_manager = EmbeddingManager()
    
    # Create chunks
    print("🔄 Creating chunks...")
    all_nodes = multi_granularity_chunking(documents, pdf_path)
    
    # Build index
    print("🔄 Building index...")
    index_builder = IndexBuilder(embedding_manager)
    vector_index = index_builder.build_vector_index(all_nodes)
    
    # Print index statistics
    stats = index_builder.get_index_stats(vector_index)
    print("\n📊 Index Statistics:")
    print(f"  Total nodes: {stats['total_nodes']}")
    print(f"  Chunk types: {stats['chunk_types']}")
    print(f"  Pages: {stats['pages']}")
    
    return vector_index, embedding_manager