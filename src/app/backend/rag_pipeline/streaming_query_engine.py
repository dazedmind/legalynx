# Streaming Query Engine for LegalLynx RAG System
# Prevents timeouts by streaming responses in real-time

import asyncio
import json
from typing import AsyncGenerator, Dict, Any, Optional
from llama_index.core.query_engine import BaseQueryEngine
from llama_index.core.response import Response
from llama_index.core.schema import NodeWithScore
from llama_index.core.retrievers import BaseRetriever
from llama_index.core.llms import LLM
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.faiss import FaissVectorStore
import faiss
import time

class StreamingQueryEngine:
    """
    Streaming query engine that provides real-time responses to prevent timeouts.
    Enhanced with adaptive multi-question handling.
    """

    def __init__(self, query_engine: BaseQueryEngine, llm: LLM,
                 vector_index: Optional[VectorStoreIndex] = None,
                 nodes: Optional[list] = None,
                 embedding_manager = None,
                 total_pages: int = 0):
        self.query_engine = query_engine
        self.llm = llm
        self.vector_index = vector_index
        self.nodes = nodes
        self.embedding_manager = embedding_manager
        self.total_pages = total_pages
        self.max_stream_time = 25  # 25 seconds max streaming time
        
    async def stream_query(self, query: str, user_id: str) -> AsyncGenerator[str, None]:
        """
        Stream query response in real-time to prevent timeouts.

        Args:
            query: User's query
            user_id: User ID for tracking

        Yields:
            JSON-formatted streaming response chunks
        """
        start_time = time.time()
        print(f"🚀 STREAMING START: Query '{query[:50]}...' for user {user_id}")
        print(f"⏱️ Start Time: {start_time}")

        try:
            # Send initial response immediately
            initial_data = {'type': 'start', 'timestamp': start_time, 'query': query, 'user_id': user_id, 'message': 'Starting analysis...'}
            initial_msg = f"data: {json.dumps(initial_data)}\n\n"
            print(f"📤 Sending: {initial_msg.strip()}")
            yield initial_msg

            # Force flush
            await asyncio.sleep(0.001)
            
            # Step 1: Retrieval (fast)
            retrieval_time = time.time()
            print(f"⏱️ RETRIEVAL START: {retrieval_time - start_time:.3f}s elapsed")

            retrieval_data = {'type': 'retrieval', 'timestamp': retrieval_time, 'message': '🔍 Retrieving relevant document sections...'}
            retrieval_msg = f"data: {json.dumps(retrieval_data)}\n\n"
            print(f"📤 Sending: {retrieval_msg.strip()}")
            yield retrieval_msg

            # Force flush
            await asyncio.sleep(0.001)
            
            # Get retrieval results
            try:
                # Use the underlying retriever directly for faster access
                if hasattr(self.query_engine, 'retriever'):
                    retriever = self.query_engine.retriever
                    retrieved_nodes = retriever.retrieve(query)
                    
                    retrieval_complete_data = {'type': 'retrieval_complete', 'timestamp': time.time(), 'message': f'✅ Retrieved {len(retrieved_nodes)} relevant sections', 'node_count': len(retrieved_nodes)}
                    yield f"data: {json.dumps(retrieval_complete_data)}\n\n"
                else:
                    retrieval_cached_data = {'type': 'retrieval_complete', 'timestamp': time.time(), 'message': '✅ Using cached retrieval results', 'node_count': 'unknown'}
                    yield f"data: {json.dumps(retrieval_cached_data)}\n\n"
                    
            except Exception as e:
                retrieval_error_data = {'type': 'retrieval_error', 'timestamp': time.time(), 'message': f'⚠️ Retrieval issue: {str(e)}', 'error': str(e)}
                yield f"data: {json.dumps(retrieval_error_data)}\n\n"
            
            # Step 2: LLM Processing (streaming)
            llm_start_data = {'type': 'llm_start', 'timestamp': time.time(), 'message': '🧠 Generating response...'}
            yield f"data: {json.dumps(llm_start_data)}\n\n"
            
            # Get retriever and LLM for real streaming
            try:
                retrieval_start = time.time()

                # Check if we should use adaptive multi-question processing
                use_adaptive = (self.vector_index is not None and
                               self.nodes is not None and
                               self.embedding_manager is not None and
                               self.total_pages > 0)

                print(f"🔍 Adaptive check: vector_index={self.vector_index is not None}, "
                      f"nodes={self.nodes is not None}, "
                      f"embedding_manager={self.embedding_manager is not None}, "
                      f"total_pages={self.total_pages}")
                print(f"🎯 use_adaptive={use_adaptive}")

                if use_adaptive:
                    # Detect number of questions
                    question_count = max(query.count("?"), 1)
                    print(f"🔍 ADAPTIVE MODE: {question_count} question(s) detected, {self.total_pages} pages")

                    # Use multi-question batch processor for multiple questions
                    if question_count > 1:
                        from rag_pipeline.multi_question_processor import (
                            MultiQuestionBatchProcessor,
                            build_multi_question_context,
                            build_multi_question_prompt,
                            split_questions
                        )

                        print(f"🎯 MULTI-QUESTION MODE: Processing {question_count} questions in batch")

                        # Create batch processor
                        batch_processor = MultiQuestionBatchProcessor(
                            self.vector_index, self.nodes, self.embedding_manager, self.total_pages
                        )

                        # Process all questions in a single optimized batch
                        retrieved_nodes, batch_metadata = await batch_processor.process_multi_question_batch(
                            query, question_count
                        )

                        print(f"✅ Batch processing complete: {len(retrieved_nodes)} deduplicated nodes")

                    else:
                        # Single question - use standard adaptive processing
                        from rag_pipeline.pipeline_builder import RAGPipelineBuilder
                        from rag_pipeline.config import get_adaptive_config

                        adaptive_config = get_adaptive_config(self.total_pages, question_count)
                        print(f"📊 Single Question Config: retrieval_top_k={adaptive_config['retrieval_top_k']}")

                        # Update LLM token limit
                        if hasattr(self.llm, 'update_token_limit'):
                            self.llm.update_token_limit(adaptive_config["max_tokens"])

                        # Build enhanced RAG pipeline
                        pipeline_builder = RAGPipelineBuilder(self.embedding_manager)
                        adaptive_engine, _ = pipeline_builder.build_enhanced_rag_pipeline(
                            self.vector_index, self.nodes, self.total_pages, question_count
                        )

                        # Get retriever from adaptive engine
                        retriever = adaptive_engine.retriever
                        retrieved_nodes = retriever.retrieve(query)
                else:
                    # Fallback to original logic
                    retriever = self.query_engine.retriever
                    print(f"⚠️ FALLBACK MODE: Using original query engine")
                    retrieved_nodes = retriever.retrieve(query)

                retrieval_complete = time.time()
                print(f"⏱️ RETRIEVAL COMPLETE: {retrieval_complete - start_time:.3f}s elapsed, found {len(retrieved_nodes)} nodes")

                # Send retrieval complete message
                complete_data = {'type': 'retrieval_complete', 'timestamp': retrieval_complete, 'message': f'✅ Found {len(retrieved_nodes)} relevant sections', 'node_count': len(retrieved_nodes)}
                complete_msg = f"data: {json.dumps(complete_data)}\n\n"
                print(f"📤 Sending: {complete_msg.strip()}")
                yield complete_msg
                await asyncio.sleep(0.001)

                # Build context with smart token budgeting
                context_start = time.time()
                question_count = max(query.count("?"), 1)

                # Use enhanced context building for multi-question queries
                if use_adaptive and question_count > 1:
                    from rag_pipeline.multi_question_processor import (
                        build_multi_question_context,
                        build_multi_question_prompt,
                        split_questions
                    )

                    print(f"🏗️ Building multi-question context...")

                    # Build optimized context with token budgeting
                    questions = split_questions(query)

                    # FIXED: Increased budget to capture more chunks for multi-question queries
                    # Use 6000 chars per question (was 3000), no cap limit
                    max_context_chars = 6000 * question_count  # Much larger budget
                    print(f"   📊 Context budget: {max_context_chars:,} chars (~{max_context_chars//4:,} tokens) for {question_count} questions")

                    # Check if nodes have scores and determine appropriate threshold
                    has_scores = any(hasattr(node, 'score') and node.score > 0 for node in retrieved_nodes[:5])

                    if has_scores:
                        # Calculate score statistics to set adaptive threshold
                        scores = [getattr(n, 'score', 0.0) for n in retrieved_nodes if hasattr(n, 'score')]
                        max_score = max(scores) if scores else 0.0
                        min_score_val = min(scores) if scores else 0.0

                        # For reranker scores which can be very low (0.0001-0.05 range),
                        # we need an extremely low threshold to keep most chunks
                        # Only filter out chunks with score exactly 0.0
                        min_score = 0.0  # Changed: don't filter by score, keep all retrieved chunks
                        print(f"   🔍 Score range: {min_score_val:.4f}-{max_score:.4f}, using min_score_threshold: {min_score:.4f} (keeping all)")
                    else:
                        min_score = 0.0
                        print(f"   🔍 No scores detected, using min_score_threshold: 0.0")

                    context_text = build_multi_question_context(
                        retrieved_nodes,
                        questions,
                        max_context_length=max_context_chars,
                        min_score_threshold=min_score  # Adaptive threshold
                    )

                    # Build multi-question optimized prompt
                    streaming_prompt = build_multi_question_prompt(questions, context_text, query)

                else:
                    # Single question - simpler context building
                    num_nodes_to_use = min(len(retrieved_nodes), 12)  # Increased from 3-15
                    print(f"📄 Using {num_nodes_to_use} nodes for single-question context")

                    context_parts = []
                    for i, node in enumerate(retrieved_nodes[:num_nodes_to_use], 1):
                        actual_node = node.node if hasattr(node, 'node') else node
                        page_info = actual_node.metadata.get('page_label', actual_node.metadata.get('page_number', 'Unknown'))
                        score = getattr(node, 'score', 0.0)

                        # Include more text for better context
                        text = actual_node.text[:800] + "..." if len(actual_node.text) > 800 else actual_node.text
                        context_parts.append(f"[Source {i} | Page {page_info} | Score: {score:.3f}]\n{text}")

                    context_text = "\n\n---\n\n".join(context_parts)

                    # Simple prompt for single question
                    streaming_prompt = f"""Based on this document context, answer directly and cite sources:

{context_text}

Q: {query}
A:"""

                context_complete = time.time()
                print(f"⏱️ CONTEXT BUILD: {context_complete - start_time:.3f}s elapsed, {len(context_text)} chars")

                # DEBUG: Log all chunks that will be sent to LLM
                print(f"\n{'='*80}")
                print(f"📋 CHUNKS SENT TO LLM (for query: '{query[:60]}...')")
                print(f"{'='*80}")
                for i, node in enumerate(retrieved_nodes[:15], 1):  # Log top 15
                    actual_node = node.node if hasattr(node, 'node') else node
                    score = getattr(node, 'score', 0.0)
                    page = actual_node.metadata.get('page_number', 'MISSING')
                    chunk_type = actual_node.metadata.get('chunk_type', 'unknown')
                    chunk_id = actual_node.node_id[:8]
                    text_preview = actual_node.text[:120].replace('\n', ' ')

                    print(f"{i:2d}. [ID:{chunk_id}] [Page:{page}] [Type:{chunk_type}] [Score:{score:.3f}]")
                    print(f"    Text: {text_preview}...")
                print(f"{'='*80}\n")

                # Signal streaming start
                stream_start = time.time()
                print(f"⏱️ LLM STREAMING START: {stream_start - start_time:.3f}s elapsed")

                stream_data = {'type': 'streaming_start', 'timestamp': stream_start, 'message': '💬 Streaming response...'}
                stream_msg = f"data: {json.dumps(stream_data)}\n\n"
                print(f"📤 Sending: {stream_msg.strip()}")
                yield stream_msg
                await asyncio.sleep(0.001)

                # Get the raw streaming response from GPT-5
                if hasattr(self.llm, 'stream_complete'):
                    print(f"⏱️ CALLING GPT-5 STREAM: {time.time() - start_time:.3f}s elapsed")
                    stream_response = self.llm.stream_complete(streaming_prompt)
                    print(f"⏱️ GPT-5 STREAM RESPONSE RECEIVED: {time.time() - start_time:.3f}s elapsed")

                    # Handle the streaming response properly
                    partial_response = ""
                    chunk_count = 0
                    first_chunk_time = None

                    # Process the streaming response from GPT-5
                    for chunk in stream_response:
                        chunk_count += 1
                        current_time = time.time()

                        if first_chunk_time is None:
                            first_chunk_time = current_time
                            print(f"⏱️ FIRST CHUNK RECEIVED: {current_time - start_time:.3f}s elapsed")

                        try:
                            # Extract text from the streaming chunk
                            chunk_text = None
                            # Check if this is a direct string response (what GPT-5 wrapper yields)
                            if isinstance(chunk, str):
                                chunk_text = chunk
                            # Check for delta in streaming chunks (shouldn't happen with current wrapper)
                            elif hasattr(chunk, 'delta') and chunk.delta:
                                chunk_text = chunk.delta
                            # Check for text content (shouldn't happen with current wrapper)
                            elif hasattr(chunk, 'text') and chunk.text:
                                chunk_text = chunk.text
                                if chunk_text == partial_response:
                                    continue  # Skip duplicate
                                if len(chunk_text) > len(partial_response):
                                    chunk_text = chunk_text[len(partial_response):]
                            else:
                                print(f"⚠️ Unexpected chunk type from GPT-5 wrapper: {type(chunk)}")

                            if chunk_text:
                                partial_response += chunk_text

                                # Send chunk immediately
                                chunk_data = {'type': 'content_chunk', 'timestamp': current_time, 'chunk': chunk_text, 'partial_response': partial_response, 'chunk_number': chunk_count, 'elapsed_time': current_time - start_time}
                                chunk_msg = f"data: {json.dumps(chunk_data)}\n\n"

                                yield chunk_msg

                                # Check timeout
                                if time.time() - start_time > self.max_stream_time:
                                    print(f"⏱️ TIMEOUT REACHED: {time.time() - start_time:.3f}s")
                                    break

                        except Exception as chunk_error:
                            print(f"⚠️ Chunk processing error: {chunk_error}")
                            continue

                    # Send only completion signal without duplicating content
                    final_time = time.time()
                    total_time = final_time - start_time
                    print(f"⏱️ STREAMING COMPLETE: {total_time:.3f}s total, {chunk_count} chunks processed")

                    # Send completion signal without final_response to avoid duplication
                    completion_data = {'type': 'stream_end', 'timestamp': final_time, 'total_time': total_time, 'source_nodes': len(retrieved_nodes), 'chunks_processed': chunk_count, 'content_length': len(partial_response)}
                    completion_msg = f"data: {json.dumps(completion_data)}\n\n"
                    print(f"📤 Sending stream end signal at {total_time:.3f}s")
                    yield completion_msg

                else:
                    # Fallback if streaming not available
                    response = self.llm.complete(streaming_prompt)
                    response_text = str(response)

                    fallback_data = {'type': 'complete', 'timestamp': time.time(), 'final_response': response_text, 'total_time': time.time() - start_time, 'source_nodes': len(retrieved_nodes)}
                    yield f"data: {json.dumps(fallback_data)}\n\n"
                        
            except Exception as e:
                error_data = {'type': 'error', 'timestamp': time.time(), 'message': f'❌ Query error: {str(e)}', 'error': str(e)}
                yield f"data: {json.dumps(error_data)}\n\n"
                    
        except Exception as e:
            stream_error_data = {'type': 'error', 'timestamp': time.time(), 'message': f'❌ Streaming error: {str(e)}', 'error': str(e)}
            yield f"data: {json.dumps(stream_error_data)}\n\n"
        
        finally:
            # Always send completion signal
            end_data = {'type': 'end', 'timestamp': time.time(), 'total_time': time.time() - start_time}
            yield f"data: {json.dumps(end_data)}\n\n"
    
    def get_streaming_stats(self) -> Dict[str, Any]:
        """Get streaming engine statistics."""
        return {
            "max_stream_time": self.max_stream_time,
            "supports_streaming": hasattr(self.llm, 'stream_complete'),
            "engine_type": type(self.query_engine).__name__,
            "llm_type": type(self.llm).__name__
        }

def create_streaming_engine(query_engine: BaseQueryEngine, llm: LLM,
                           vector_index: Optional[VectorStoreIndex] = None,
                           nodes: Optional[list] = None,
                           embedding_manager = None,
                           total_pages: int = 0) -> StreamingQueryEngine:
    """
    Factory function to create a streaming query engine.
    Enhanced to support adaptive multi-question handling.
    """
    return StreamingQueryEngine(
        query_engine, llm,
        vector_index=vector_index,
        nodes=nodes,
        embedding_manager=embedding_manager,
        total_pages=total_pages
    )