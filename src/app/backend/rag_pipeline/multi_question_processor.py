# Multi-Question Batch Processor for LegalLynx RAG System
# Handles multiple questions efficiently with deduplication and batching

import asyncio
import re
from typing import List, Dict, Set, Tuple, Optional
from llama_index.core.schema import NodeWithScore, QueryBundle, TextNode
from llama_index.core.retrievers import BaseRetriever
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.faiss import FaissVectorStore
import faiss
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.retrievers.bm25 import BM25Retriever
from .config import get_adaptive_config, MODEL_CONFIG
import time


def split_questions(query: str) -> List[str]:
    """
    Split a multi-question query into individual questions.

    Args:
        query: The input query string

    Returns:
        List of individual questions
    """
    # Split by question marks, keeping the question mark
    questions = re.split(r'(\?)', query)

    # Recombine questions with their question marks
    result = []
    current = ""
    for part in questions:
        current += part
        if part == '?':
            # Clean up the question
            question = current.strip()
            if question and len(question) > 3:  # Filter out very short fragments
                result.append(question)
            current = ""

    # Add any remaining text as a question
    if current.strip() and len(current.strip()) > 3:
        result.append(current.strip())

    return result if result else [query]


class MultiQuestionBatchProcessor:
    """
    Efficiently processes multiple questions in a single batch:
    - Single retrieval pass for all questions
    - Deduplicates chunks
    - Merges and ranks results
    - Prepares comprehensive context for LLM
    """

    def __init__(self, vector_index: VectorStoreIndex, nodes: List[TextNode],
                 embedding_manager, total_pages: int):
        self.vector_index = vector_index
        self.nodes = nodes
        self.embedding_manager = embedding_manager
        self.total_pages = total_pages
        self.llm = embedding_manager.get_llm()

    async def process_multi_question_batch(self, query: str, num_questions: int) -> Tuple[List[NodeWithScore], Dict]:
        """
        Process multiple questions in a single optimized batch.

        Args:
            query: The full multi-question query
            num_questions: Number of questions detected

        Returns:
            Tuple of (deduplicated_nodes, metadata)
        """
        start_time = time.time()
        print(f"🔄 BATCH PROCESSING: {num_questions} questions")

        # Split questions
        questions = split_questions(query)
        print(f"📝 Split into {len(questions)} individual questions:")
        for i, q in enumerate(questions, 1):
            print(f"   {i}. {q}")

        # Get adaptive configuration for multi-question query
        adaptive_config = get_adaptive_config(self.total_pages, num_questions)
        retrieval_top_k = adaptive_config["retrieval_top_k"]
        rerank_top_n = adaptive_config["rerank_top_n"]

        print(f"📊 Adaptive Config: retrieval_top_k={retrieval_top_k}, rerank_top_n={rerank_top_n}")

        # Update LLM token limit
        if hasattr(self.llm, 'update_token_limit'):
            self.llm.update_token_limit(adaptive_config["max_tokens"])

        # Build retrievers
        num_nodes = len(self.nodes)
        safe_top_k = min(num_nodes, retrieval_top_k)

        vector_retriever = self.vector_index.as_retriever(similarity_top_k=safe_top_k)
        bm25_retriever = BM25Retriever.from_defaults(nodes=self.nodes, similarity_top_k=safe_top_k)

        # STEP 1: Enhanced Retrieval with entity detection
        retrieval_start = time.time()
        all_retrieved_nodes = []

        # Create combined query for retrieval (better than individual queries)
        combined_query = " ".join(questions)
        print(f"🔍 Combined query: {combined_query[:200]}...")

        # Extract potential entity names from query (capitalized words)
        import re
        entities = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', combined_query)
        if entities:
            print(f"🏷️ Detected entities: {', '.join(set(entities))}")

        # Retrieve using both methods
        print(f"🔄 Running FAISS semantic search (top_k={safe_top_k})...")
        vector_nodes = vector_retriever.retrieve(combined_query)

        print(f"🔄 Running BM25 keyword search (top_k={safe_top_k})...")
        bm25_nodes = bm25_retriever.retrieve(combined_query)

        # Enhanced entity-specific retrieval for BM25
        entity_nodes = []
        if entities:
            for entity in set(entities):
                print(f"🔍 Entity search for: {entity}")
                entity_results = bm25_retriever.retrieve(entity)
                entity_nodes.extend(entity_results[:3])  # Top 3 for each entity

        print(f"⏱️ Retrieval: {time.time() - retrieval_start:.3f}s")
        print(f"   📊 Vector: {len(vector_nodes)} | BM25: {len(bm25_nodes)} | Entity: {len(entity_nodes)}")

        # STEP 2: Deduplicate nodes (avoid token waste)
        dedup_start = time.time()
        seen_ids: Set[str] = set()
        deduplicated_nodes = []

        # Interleave for diversity (important for multi-questions)
        # Priority: Vector (semantic) → Entity (exact match) → BM25 (keyword)
        max_len = max(len(vector_nodes), len(bm25_nodes), len(entity_nodes))
        for i in range(max_len):
            # Add vector node
            if i < len(vector_nodes) and vector_nodes[i].node_id not in seen_ids:
                deduplicated_nodes.append(vector_nodes[i])
                seen_ids.add(vector_nodes[i].node_id)

            # Add entity node (high priority for exact entity matches)
            if i < len(entity_nodes) and entity_nodes[i].node_id not in seen_ids:
                deduplicated_nodes.append(entity_nodes[i])
                seen_ids.add(entity_nodes[i].node_id)

            # Add BM25 node
            if i < len(bm25_nodes) and bm25_nodes[i].node_id not in seen_ids:
                deduplicated_nodes.append(bm25_nodes[i])
                seen_ids.add(bm25_nodes[i].node_id)

        print(f"⏱️ Deduplication: {time.time() - dedup_start:.3f}s")
        print(f"   🎯 {len(deduplicated_nodes)} unique nodes from {len(vector_nodes) + len(bm25_nodes) + len(entity_nodes)} total")

        # STEP 3: Rerank the deduplicated nodes
        rerank_start = time.time()
        if len(deduplicated_nodes) > 1:
            try:
                reranker = SentenceTransformerRerank(
                    model=MODEL_CONFIG["rerank_model"],
                    top_n=min(rerank_top_n, len(deduplicated_nodes))
                )
                # Rerank using the combined query
                reranked_nodes = reranker.postprocess_nodes(deduplicated_nodes, query_str=combined_query)

                # Verify scores were assigned
                scores_present = sum(1 for n in reranked_nodes if hasattr(n, 'score') and n.score > 0)
                print(f"⏱️ Reranking: {time.time() - rerank_start:.3f}s - Top {len(reranked_nodes)} nodes, {scores_present} with scores")

                # If reranking didn't assign scores, use original nodes with their retrieval scores
                if scores_present == 0:
                    print(f"⚠️ Reranker didn't assign scores, keeping original retrieval scores")
                    reranked_nodes = deduplicated_nodes[:rerank_top_n]

            except Exception as e:
                print(f"⚠️ Reranking failed: {e}, using deduplicated nodes")
                import traceback
                print(f"   Traceback: {traceback.format_exc()[:200]}")
                reranked_nodes = deduplicated_nodes[:rerank_top_n]
        else:
            reranked_nodes = deduplicated_nodes
            print(f"⏱️ Skipping reranking (only 1 node)")

        # STEP 4: Sort by score and page for better context
        final_nodes = sorted(
            reranked_nodes,
            key=lambda x: (
                getattr(x, 'score', 0.0) if hasattr(x, 'score') else 0.0,
                x.node.metadata.get('page_number', 999) if hasattr(x, 'node') else x.metadata.get('page_number', 999)
            ),
            reverse=True
        )

        # STEP 5: Detailed logging of retrieved chunks
        print(f"\n📋 RETRIEVED CHUNKS DETAIL (Top {min(10, len(final_nodes))}):")
        print("=" * 80)

        # Calculate score statistics for better threshold setting
        all_scores = [getattr(n, 'score', 0.0) for n in final_nodes if hasattr(n, 'score')]
        if all_scores:
            max_score = max(all_scores)
            min_score = min(all_scores)
            avg_score = sum(all_scores) / len(all_scores)
            print(f"📊 Score Statistics: min={min_score:.4f}, max={max_score:.4f}, avg={avg_score:.4f}")
            print(f"   Scores > 0.01: {sum(1 for s in all_scores if s > 0.01)}/{len(all_scores)}")
        else:
            print("⚠️ No scores found in nodes!")
        print()

        for i, node in enumerate(final_nodes[:10], 1):
            actual_node = node.node if hasattr(node, 'node') else node
            score = getattr(node, 'score', 0.0)
            page = actual_node.metadata.get('page_number', 'N/A')
            chunk_type = actual_node.metadata.get('chunk_type', 'unknown')
            chunk_id = actual_node.node_id[:8]
            text_preview = actual_node.text[:100].replace('\n', ' ')

            print(f"{i}. [Score: {score:.4f}] [Page: {page}] [Type: {chunk_type}] [ID: {chunk_id}]")
            print(f"   Preview: {text_preview}...")
            print()

        total_time = time.time() - start_time

        # Enhanced metadata with detailed chunk information
        metadata = {
            "questions": questions,
            "num_questions": len(questions),
            "total_nodes_retrieved": len(vector_nodes) + len(bm25_nodes) + len(entity_nodes),
            "deduplicated_nodes": len(deduplicated_nodes),
            "reranked_nodes": len(reranked_nodes),
            "final_nodes": len(final_nodes),
            "retrieval_time": time.time() - retrieval_start,
            "total_time": total_time,
            "adaptive_config": adaptive_config,
            "entities_detected": list(set(entities)) if entities else [],
            "chunk_details": [
                {
                    "rank": i + 1,
                    "score": getattr(node, 'score', 0.0),
                    "page": (node.node if hasattr(node, 'node') else node).metadata.get('page_number', 'N/A'),
                    "chunk_type": (node.node if hasattr(node, 'node') else node).metadata.get('chunk_type', 'unknown'),
                    "chunk_id": (node.node if hasattr(node, 'node') else node).node_id[:8]
                }
                for i, node in enumerate(final_nodes)
            ]
        }

        print(f"✅ BATCH COMPLETE: {total_time:.3f}s - {len(final_nodes)} nodes ready for LLM")
        print(f"   Entities detected: {len(entities) if entities else 0}")
        print(f"   Page coverage: {len(set(m['page'] for m in metadata['chunk_details']))} unique pages")
        print("=" * 80)

        return final_nodes, metadata


def build_multi_question_context(nodes: List[NodeWithScore], questions: List[str],
                                 max_context_length: int = 12000,
                                 min_score_threshold: float = 0.0) -> str:
    """
    Build optimized context from deduplicated nodes for multi-question answering.
    Implements smart token budgeting: drops low-score chunks instead of truncating.

    Args:
        nodes: Deduplicated and ranked nodes (should be sorted by score DESC)
        questions: List of individual questions
        max_context_length: Maximum context length in characters (~3000 tokens)
        min_score_threshold: Minimum score to include (default: 0.0 = include all)

    Returns:
        Formatted context string optimized for multi-question answering
    """
    context_parts = []
    current_length = 0
    dropped_low_score = 0
    dropped_over_budget = 0
    dropped_too_large = 0

    print(f"\n🏗️ BUILDING CONTEXT (Budget: {max_context_length} chars)")
    print(f"   Input nodes: {len(nodes)}")
    print(f"   Score threshold: {min_score_threshold:.3f}")

    # CRITICAL FIX: Prioritize small and medium chunks for multi-question queries
    # Sort nodes: small chunks first, then medium, then large (within same score tier)
    def chunk_priority(node):
        actual_node = node.node if hasattr(node, 'node') else node
        chunk_type = actual_node.metadata.get('chunk_type', 'unknown')
        score = getattr(node, 'score', 0.0)

        # Priority: high score + small chunks come first
        type_priority = {'small': 0, 'medium': 1, 'large': 2, 'unknown': 3}
        return (type_priority.get(chunk_type, 3), -score)  # Sort by type, then by score desc

    sorted_nodes = sorted(nodes, key=chunk_priority)

    for i, node in enumerate(sorted_nodes):
        # Get node details
        if hasattr(node, 'node'):
            actual_node = node.node
            score = getattr(node, 'score', 0.0)
        else:
            actual_node = node
            score = getattr(node, 'score', 0.0)

        # Skip low-score nodes to save budget for high-quality chunks
        if score < min_score_threshold:
            dropped_low_score += 1
            continue

        page_num = actual_node.metadata.get('page_number', 'Unknown')
        chunk_type = actual_node.metadata.get('chunk_type', 'unknown')
        text = actual_node.text

        # OPTIMIZED: Skip chunks that are too large (>2000 chars) to fit more chunks
        if len(text) > 2000:
            dropped_too_large += 1
            continue

        # OPTIMIZED: Simpler formatting to save space and include more chunks
        # Use compact headers without emojis
        header = f"[Source {i+1} | Page {page_num}]"
        formatted = f"{header}\n{text}\n"

        # Check if adding this would exceed budget
        if current_length + len(formatted) > max_context_length:
            dropped_over_budget += 1
            # Stop adding more chunks (drops low-priority ones)
            continue

        context_parts.append(formatted)
        current_length += len(formatted)

    # OPTIMIZED: Use more compact separator to save space
    context = "\n---\n".join(context_parts)

    # Calculate statistics
    avg_score = sum(getattr(n, 'score', 0.0) for n in nodes[:len(context_parts)]) / max(len(context_parts), 1)
    unique_pages = len(set(
        (n.node if hasattr(n, 'node') else n).metadata.get('page_number', 'Unknown')
        for n in nodes[:len(context_parts)]
    ))

    # Count chunk types included
    chunk_types_included = {}
    for node in sorted_nodes[:len(context_parts)]:
        actual_node = node.node if hasattr(node, 'node') else node
        chunk_type = actual_node.metadata.get('chunk_type', 'unknown')
        chunk_types_included[chunk_type] = chunk_types_included.get(chunk_type, 0) + 1

    print(f"✅ Context built successfully:")
    print(f"   📝 Chunks included: {len(context_parts)} / {len(nodes)}")
    print(f"   📏 Total length: {current_length:,} / {max_context_length:,} chars (~{current_length//4} tokens)")
    print(f"   📊 Avg score: {avg_score:.3f}")
    print(f"   📄 Page coverage: {unique_pages} unique pages")
    print(f"   🔍 Chunk types: {chunk_types_included}")
    print(f"   🗑️ Dropped: {dropped_low_score} low-score + {dropped_too_large} too-large + {dropped_over_budget} over-budget")

    return context


def build_multi_question_prompt(questions: List[str], context: str, original_query: str) -> str:
    """
    Build an optimized prompt for answering multiple questions.

    Args:
        questions: List of individual questions
        context: The document context
        original_query: The original query string

    Returns:
        Formatted prompt for the LLM
    """
    prompt = f"""You are analyzing a legal document to answer multiple questions. You have been provided with the most relevant excerpts from the document.

DOCUMENT CONTEXT:
{context}

QUESTIONS TO ANSWER (all from the same query):
"""

    for i, q in enumerate(questions, 1):
        prompt += f"{i}. {q}\n"

    prompt += """
INSTRUCTIONS:
- Answer ALL questions comprehensively
- For each answer, cite the specific [Source #] and page number
- If information for a question is not in the provided context, explicitly state "Information not found in provided excerpts [Source context reviewed]"
- Use this format:

**Question 1:** [Repeat question]
**Answer:** [Your answer with citations like [Source 1, Page X]]

**Question 2:** [Repeat question]
**Answer:** [Your answer with citations]

[Continue for all questions]

Begin your response:
"""

    return prompt