# Multi-Query Processor for RAG Pipeline
# Processes multiple questions and aggregates their responses

import asyncio
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed

from .question_splitter import QuestionSplitter, SplitQuestion

@dataclass
class QueryResult:
    """Represents the result of a single query."""
    question: str
    response: str
    source_count: int
    processing_time: float
    success: bool
    error_message: Optional[str] = None
    question_type: str = "other"

@dataclass
class MultiQueryResult:
    """Represents the aggregated result of multiple queries."""
    original_query: str
    individual_results: List[QueryResult]
    aggregated_response: str
    total_processing_time: float
    total_source_count: int
    questions_processed: int
    questions_successful: int

class MultiQueryProcessor:
    """
    Processes multi-question prompts by splitting them into individual queries
    and aggregating their responses for better RAG pipeline performance.
    """
    
    def __init__(self, max_concurrent_queries: int = 6):
        self.question_splitter = QuestionSplitter()
        self.max_concurrent_queries = max_concurrent_queries
        
    def should_split_query(self, query: str) -> bool:
        """
        Determine if a query should be split into multiple questions.
        
        Args:
            query: The input query string
            
        Returns:
            bool: True if the query should be split
        """
        return self.question_splitter.detect_multi_question(query)
    
    def process_multi_query(self, query: str, query_engine, max_concurrent: Optional[int] = None) -> MultiQueryResult:
        """
        Process a multi-question query by splitting and executing individual queries.
        
        Args:
            query: The original multi-question query
            query_engine: The RAG query engine to use for individual queries
            max_concurrent: Maximum number of concurrent queries (defaults to instance setting)
            
        Returns:
            MultiQueryResult: Aggregated results from all individual queries
        """
        start_time = time.time()
        
        # Split the query into individual questions
        split_questions = self.question_splitter.split_questions(query)
        
        print(f"🔀 Split query into {len(split_questions)} questions")
        for i, q in enumerate(split_questions, 1):
            print(f"   {i}. {q.question} (type: {q.question_type})")
        
        # If only one question, process normally
        if len(split_questions) <= 1:
            single_result = self._execute_single_query(split_questions[0].question if split_questions else query, query_engine)
            return MultiQueryResult(
                original_query=query,
                individual_results=[single_result],
                aggregated_response=single_result.response,
                total_processing_time=single_result.processing_time,
                total_source_count=single_result.source_count,
                questions_processed=1,
                questions_successful=1 if single_result.success else 0
            )
        
        # Process multiple questions
        max_workers = min(max_concurrent or self.max_concurrent_queries, len(split_questions))
        individual_results = []
        
        # Execute queries with controlled concurrency
        if max_workers > 1:
            individual_results = self._execute_concurrent_queries(split_questions, query_engine, max_workers)
        else:
            individual_results = self._execute_sequential_queries(split_questions, query_engine)
        
        # Aggregate results
        aggregated_response = self._aggregate_responses(individual_results, query)
        
        total_time = time.time() - start_time
        total_sources = sum(result.source_count for result in individual_results)
        successful_queries = sum(1 for result in individual_results if result.success)
        
        print(f"✅ Multi-query processing completed: {successful_queries}/{len(split_questions)} successful in {total_time:.2f}s")
        
        return MultiQueryResult(
            original_query=query,
            individual_results=individual_results,
            aggregated_response=aggregated_response,
            total_processing_time=total_time,
            total_source_count=total_sources,
            questions_processed=len(split_questions),
            questions_successful=successful_queries
        )
    
    def _execute_concurrent_queries(self, questions: List[SplitQuestion], query_engine, max_workers: int) -> List[QueryResult]:
        """Execute multiple queries concurrently using ThreadPoolExecutor."""
        results = []
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit all queries
            future_to_question = {
                executor.submit(self._execute_single_query, q.question, query_engine): q 
                for q in questions
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_question):
                question = future_to_question[future]
                try:
                    result = future.result()
                    result.question_type = question.question_type
                    results.append(result)
                    print(f"✅ Completed: {question.question[:50]}...")
                except Exception as e:
                    error_result = QueryResult(
                        question=question.question,
                        response=f"Error processing question: {str(e)}",
                        source_count=0,
                        processing_time=0.0,
                        success=False,
                        error_message=str(e),
                        question_type=question.question_type
                    )
                    results.append(error_result)
                    print(f"❌ Failed: {question.question[:50]}... - {str(e)}")
        
        # Sort results by original question order
        question_order = {q.question: i for i, q in enumerate(questions)}
        results.sort(key=lambda r: question_order.get(r.question, 999))
        
        return results
    
    def _execute_sequential_queries(self, questions: List[SplitQuestion], query_engine) -> List[QueryResult]:
        """Execute queries sequentially (fallback for single-threaded processing)."""
        results = []
        
        for question in questions:
            print(f"🔍 Processing: {question.question}")
            result = self._execute_single_query(question.question, query_engine)
            result.question_type = question.question_type
            results.append(result)
            
            if result.success:
                print(f"✅ Completed: {question.question[:50]}... ({result.processing_time:.2f}s)")
            else:
                print(f"❌ Failed: {question.question[:50]}... - {result.error_message}")
        
        return results
    
    def _execute_single_query(self, question: str, query_engine) -> QueryResult:
        """Execute a single query and return the result."""
        start_time = time.time()
        
        try:
            # Execute the query
            response = query_engine.query(question)
            response_text = str(response)
            
            # Extract source count
            source_count = 0
            if hasattr(response, 'source_nodes') and response.source_nodes:
                source_count = len(response.source_nodes)
            
            processing_time = time.time() - start_time
            
            return QueryResult(
                question=question,
                response=response_text,
                source_count=source_count,
                processing_time=processing_time,
                success=True
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            return QueryResult(
                question=question,
                response=f"I apologize, but I encountered an error while processing this question: {str(e)}",
                source_count=0,
                processing_time=processing_time,
                success=False,
                error_message=str(e)
            )
    
    def _aggregate_responses(self, results: List[QueryResult], original_query: str) -> str:
        """
        Aggregate individual query responses into a cohesive answer.
        
        Args:
            results: List of individual query results
            original_query: The original multi-question query
            
        Returns:
            str: Aggregated response
        """
        if not results:
            return "I apologize, but I couldn't process any of the questions in your query."
        
        successful_results = [r for r in results if r.success]
        
        if not successful_results:
            return "I apologize, but I encountered errors processing all questions in your query. Please try rephrasing your questions or ask them individually."
        
        # Build aggregated response
        response_parts = []
        
        # Add introduction if multiple questions
        if len(successful_results) > 1:
            response_parts.append(f"I'll address each of your {len(successful_results)} questions:\n")
        
        # Add individual responses with clear separation
        for i, result in enumerate(successful_results, 1):
            if len(successful_results) > 1:
                # Format as numbered responses for multi-question
                response_parts.append(f"**{i}. {result.question}**")
                response_parts.append(result.response)
                response_parts.append("")  # Add spacing
            else:
                # Single question - just return the response
                response_parts.append(result.response)
        
        # Add summary of failed questions if any
        failed_results = [r for r in results if not r.success]
        if failed_results:
            response_parts.append(f"\n*Note: I was unable to process {len(failed_results)} question(s) due to errors.*")
        
        return "\n".join(response_parts).strip()
    
    def get_processing_stats(self, result: MultiQueryResult) -> Dict[str, Any]:
        """
        Get detailed processing statistics for a multi-query result.
        
        Args:
            result: The multi-query result to analyze
            
        Returns:
            Dict containing processing statistics
        """
        successful_results = [r for r in result.individual_results if r.success]
        failed_results = [r for r in result.individual_results if not r.success]
        
        # Calculate average processing time for successful queries
        avg_time = (
            sum(r.processing_time for r in successful_results) / len(successful_results)
            if successful_results else 0
        )
        
        # Group by question type
        question_types = {}
        for result_item in result.individual_results:
            q_type = result_item.question_type
            if q_type not in question_types:
                question_types[q_type] = {'count': 0, 'successful': 0}
            question_types[q_type]['count'] += 1
            if result_item.success:
                question_types[q_type]['successful'] += 1
        
        return {
            'total_questions': result.questions_processed,
            'successful_questions': result.questions_successful,
            'failed_questions': len(failed_results),
            'success_rate': result.questions_successful / result.questions_processed if result.questions_processed > 0 else 0,
            'total_processing_time': result.total_processing_time,
            'average_time_per_question': avg_time,
            'total_sources': result.total_source_count,
            'question_types': question_types,
            'was_split': result.questions_processed > 1,
            'original_query_length': len(result.original_query)
        }

def create_multi_query_processor(max_concurrent_queries: int = 3) -> MultiQueryProcessor:
    """Factory function to create a MultiQueryProcessor instance."""
    return MultiQueryProcessor(max_concurrent_queries)

# Example usage and testing
if __name__ == "__main__":
    # This would normally be tested with a real query engine
    processor = create_multi_query_processor()
    
    test_query = "who is natrapharm? what did po3 labbutan do? what's the ruling on devie fuertes? how did batucan harass the female worker? is talaue guilty? does dks follow philippine law?"
    
    print(f"Test query: {test_query}")
    print(f"Should split: {processor.should_split_query(test_query)}")
    
    # Split questions for demonstration
    questions = processor.question_splitter.split_questions(test_query)
    print(f"\nWould split into {len(questions)} questions:")
    for i, q in enumerate(questions, 1):
        print(f"{i}. {q.question} (type: {q.question_type})")
