import os
import torch
import asyncio
import time
from typing import List, Dict, Any, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from llama_index.core import Settings
from llama_index.vector_stores.faiss import FaissVectorStore
from llama_index.core import VectorStoreIndex, StorageContext
import faiss
from openai import OpenAI
from llama_index.core.schema import TextNode
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.embeddings import BaseEmbedding
from rag_pipeline.config import MODEL_CONFIG


class OptimizedEmbeddingManager:
    """
    🚀 RAILWAY-OPTIMIZED: High-performance embedding manager with batching and parallelization.
    Designed for Railway Pro (32GB RAM, 32 vCPU) to achieve <90s for 100+ page PDFs.
    """
    
    def __init__(self):
        """
        Initialize the optimized embedding manager with global model loading.
        """
        # ✅ FIXED: Configure PyTorch settings to avoid meta tensor issues
        torch.set_default_dtype(torch.float32)
        if hasattr(torch, '_C') and hasattr(torch._C, '_set_print_sparse'):
            torch._C._set_print_sparse(False)
        
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.embed_model = None
        self.llm = None
        self._batch_size = 50  # Optimal batch size for local models
        self._max_workers = 10  # Parallel workers for Railway Pro
        self._setup_models()
    
    def get_adaptive_chunk_size(self, total_pages: int) -> Dict[str, int]:
        """
        🎯 ADAPTIVE CHUNK SIZING: Optimize chunk sizes based on document size.
        Reduces total chunks → fewer embedding calls → faster processing.
        """
        if total_pages <= 20:
            return {
                "small_chunk_size": 600,
                "medium_chunk_size": 800,
                "large_chunk_size": 1200,
                "small_chunk_overlap": 100,
                "medium_chunk_overlap": 150,
                "large_chunk_overlap": 200
            }
        elif total_pages <= 100:
            return {
                "small_chunk_size": 1000,
                "medium_chunk_size": 1500,
                "large_chunk_size": 2000,
                "small_chunk_overlap": 150,
                "medium_chunk_overlap": 200,
                "large_chunk_overlap": 300
            }
        else:  # > 100 pages
            return {
                "small_chunk_size": 1500,
                "medium_chunk_size": 2000,
                "large_chunk_size": 3000,
                "small_chunk_overlap": 200,
                "medium_chunk_overlap": 300,
                "large_chunk_overlap": 400
            }
    
    async def embed_batch_parallel(self, text_batches: List[List[str]]) -> List[List[float]]:
        """
        🚀 PARALLEL BATCH EMBEDDING: Process multiple batches concurrently using local models.
        Uses Railway Pro's 32 vCPU for maximum parallelization.
        """
        print(f"🔄 Processing {len(text_batches)} batches in parallel with local models...")
        start_time = time.time()
        
        async def embed_single_batch(batch: List[str]) -> List[List[float]]:
            """Embed a single batch of texts using local HuggingFace model."""
            try:
                # Use local HuggingFace model for embeddings
                return await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self.embed_model.get_text_embedding_batch(batch)
                )
            except Exception as e:
                print(f"⚠️ Batch embedding failed: {e}")
                # Fallback to individual embeddings
                return await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: [self.embed_model.get_text_embedding(text) for text in batch]
                )
        
        # Process all batches concurrently
        tasks = [embed_single_batch(batch) for batch in text_batches]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions
        embeddings = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"⚠️ Batch {i} failed: {result}, using fallback")
                # Fallback to individual processing
                batch_embeddings = []
                for text in text_batches[i]:
                    try:
                        batch_embeddings.append(self.embed_model.get_text_embedding(text))
                    except Exception as e:
                        print(f"⚠️ Individual embedding failed: {e}")
                        # Get embedding dimension from model
                        try:
                            test_embedding = self.embed_model.get_text_embedding("test")
                            fallback_vector = [0.0] * len(test_embedding)
                        except:
                            fallback_vector = [0.0] * 384  # Default dimension for all-MiniLM-L6-v2
                        batch_embeddings.append(fallback_vector)
                embeddings.append(batch_embeddings)
            else:
                embeddings.append(result)
        
        processing_time = time.time() - start_time
        total_texts = sum(len(batch) for batch in text_batches)
        print(f"✅ Parallel embedding complete: {total_texts} texts in {processing_time:.2f}s ({total_texts/processing_time:.1f} texts/sec)")
        
        return embeddings
    
    def create_batches(self, texts: List[str], batch_size: int = None) -> List[List[str]]:
        """
        📦 BATCH CREATION: Split texts into optimal batches for parallel processing.
        """
        if batch_size is None:
            batch_size = self._batch_size
        
        batches = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            batches.append(batch)
        
        print(f"📦 Created {len(batches)} batches (avg {len(batches[0]) if batches else 0} texts per batch)")
        return batches
    
    def _setup_models(self):
        """
        🚀 OPTIMIZED MODEL SETUP: Initialize local embedding models for Railway Pro.
        Uses persistent model loading to avoid cold starts.
        """
        print("🔄 Initializing optimized local embedding models for Railway Pro...")
        start_time = time.time()
        
        # Use only local HuggingFace models
        self._setup_local_model()
        
        # Setup LLM
        self._setup_llm()
        
        init_time = time.time() - start_time
        print(f"✅ Optimized local models ready in {init_time:.2f}s")
    
    def _setup_local_model(self):
        """Setup local HuggingFace model for Railway Pro optimization."""
        try:
            print("📦 Using HuggingFace embeddings for Railway Pro...")
            self.embed_model = HuggingFaceEmbedding(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                device="cpu"
            )
            Settings.embed_model = self.embed_model
            print("✅ HuggingFace embedding model loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load local embedding model: {e}")
            raise
    
    def _setup_llm(self):
        """Setup LLM for text generation."""
        try:
            if self.openai_api_key:
                print("🌐 Using OpenAI LLM...")
                self.llm = OpenAI(api_key=self.openai_api_key)
            else:
                print("⚠️ No OpenAI API key for LLM")
        except Exception as e:
            print(f"⚠️ LLM setup failed: {e}")
    
    def get_embedding_model(self):
        """Get the embedding model."""
        return self.embed_model
    
    def get_llm(self):
        """Get the LLM."""
        return self.llm
    


# Backward compatibility
EmbeddingManager = OptimizedEmbeddingManager