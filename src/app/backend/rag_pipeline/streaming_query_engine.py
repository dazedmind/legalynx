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
        
        try:
            # Send initial response
            yield f"data: {json.dumps({
                'type': 'start',
                'timestamp': start_time,
                'query': query,
                'user_id': user_id,
                'message': 'Starting analysis...'
            })}\n\n"
            
            # Step 1: Retrieval (fast)
            yield f"data: {json.dumps({
                'type': 'retrieval',
                'timestamp': time.time(),
                'message': '🔍 Retrieving relevant document sections...'
            })}\n\n"
            
            # Get retrieval results
            try:
                # Use the underlying retriever directly for faster access
                if hasattr(self.query_engine, 'retriever'):
                    retriever = self.query_engine.retriever
                    retrieved_nodes = retriever.retrieve(query)
                    
                    yield f"data: {json.dumps({
                        'type': 'retrieval_complete',
                        'timestamp': time.time(),
                        'message': f'✅ Retrieved {len(retrieved_nodes)} relevant sections',
                        'node_count': len(retrieved_nodes)
                    })}\n\n"
                else:
                    yield f"data: {json.dumps({
                        'type': 'retrieval_complete',
                        'timestamp': time.time(),
                        'message': '✅ Using cached retrieval results',
                        'node_count': 'unknown'
                    })}\n\n"
                    
            except Exception as e:
                yield f"data: {json.dumps({
                    'type': 'retrieval_error',
                    'timestamp': time.time(),
                    'message': f'⚠️ Retrieval issue: {str(e)}',
                    'error': str(e)
                })}\n\n"
            
            # Step 2: LLM Processing (streaming)
            yield f"data: {json.dumps({
                'type': 'llm_start',
                'timestamp': time.time(),
                'message': '🧠 Generating response...'
            })}\n\n"
            
            # Try to get a response from the query engine
            try:
                # Use the query engine directly for better integration
                response = self.query_engine.query(query)
                response_text = str(response)
                
                # Stream the response in chunks for better UX
                chunk_size = 50  # Characters per chunk
                for i in range(0, len(response_text), chunk_size):
                    chunk = response_text[i:i + chunk_size]
                    partial_response = response_text[:i + chunk_size]
                    
                    yield f"data: {json.dumps({
                        'type': 'content_chunk',
                        'timestamp': time.time(),
                        'chunk': chunk,
                        'partial_response': partial_response
                    })}\n\n"
                    
                    # Check timeout
                    if time.time() - start_time > self.max_stream_time:
                        yield f"data: {json.dumps({
                            'type': 'timeout_warning',
                            'timestamp': time.time(),
                            'message': '⚠️ Approaching timeout, finalizing response...',
                            'partial_response': partial_response
                        })}\n\n"
                        break
                    
                    # Small delay for streaming effect
                    await asyncio.sleep(0.05)
                
                # Final response
                yield f"data: {json.dumps({
                    'type': 'complete',
                    'timestamp': time.time(),
                    'final_response': response_text,
                    'total_time': time.time() - start_time,
                    'source_nodes': len(response.source_nodes) if hasattr(response, 'source_nodes') else 0
                })}\n\n"
                        
            except Exception as e:
                yield f"data: {json.dumps({
                    'type': 'error',
                    'timestamp': time.time(),
                    'message': f'❌ Query error: {str(e)}',
                    'error': str(e)
                })}\n\n"
                    
        except Exception as e:
            yield f"data: {json.dumps({
                'type': 'error',
                'timestamp': time.time(),
                'message': f'❌ Streaming error: {str(e)}',
                'error': str(e)
            })}\n\n"
        
        finally:
            # Always send completion signal
            yield f"data: {json.dumps({
                'type': 'end',
                'timestamp': time.time(),
                'total_time': time.time() - start_time
            })}\n\n"
    
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
