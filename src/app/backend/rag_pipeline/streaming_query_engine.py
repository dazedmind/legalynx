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
import time

class StreamingQueryEngine:
    """
    Streaming query engine that provides real-time responses to prevent timeouts.
    """
    
    def __init__(self, query_engine: BaseQueryEngine, llm: LLM):
        self.query_engine = query_engine
        self.llm = llm
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
                retriever = self.query_engine.retriever
                retrieved_nodes = retriever.retrieve(query)
                retrieval_complete = time.time()
                print(f"⏱️ RETRIEVAL COMPLETE: {retrieval_complete - start_time:.3f}s elapsed, found {len(retrieved_nodes)} nodes")

                # Send retrieval complete message
                complete_data = {'type': 'retrieval_complete', 'timestamp': retrieval_complete, 'message': f'✅ Found {len(retrieved_nodes)} relevant sections', 'node_count': len(retrieved_nodes)}
                complete_msg = f"data: {json.dumps(complete_data)}\n\n"
                print(f"📤 Sending: {complete_msg.strip()}")
                yield complete_msg
                await asyncio.sleep(0.001)

                # Build context quickly
                context_start = time.time()
                context_parts = []
                for node in retrieved_nodes[:3]:  # Use top 3 nodes
                    page_info = node.metadata.get('page_label', 'Unknown')
                    text = node.text[:400] + "..." if len(node.text) > 400 else node.text
                    context_parts.append(f"[Page {page_info}]: {text}")

                context_text = "\n\n".join(context_parts)
                context_complete = time.time()
                print(f"⏱️ CONTEXT BUILD: {context_complete - start_time:.3f}s elapsed")

                # Create optimized prompt
                streaming_prompt = f"""Based on this document context, answer directly:

{context_text}

Q: {query}
A:"""

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

def create_streaming_engine(query_engine: BaseQueryEngine, llm: LLM) -> StreamingQueryEngine:
    """Factory function to create a streaming query engine."""
    return StreamingQueryEngine(query_engine, llm)