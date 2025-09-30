# Question Splitter for Multi-Question Prompts
# Automatically splits complex prompts containing multiple questions into individual queries

import re
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

@dataclass
class SplitQuestion:
    """Represents a single question extracted from a multi-question prompt."""
    question: str
    original_index: int
    confidence: float
    question_type: str  # 'who', 'what', 'where', 'when', 'why', 'how', 'is', 'does', 'other'

class QuestionSplitter:
    """
    Splits multi-question prompts into individual questions for better RAG pipeline performance.
    
    Handles various question patterns and formats:
    - Question mark separated: "Who is X? What did Y do? How did Z happen?"
    - Conjunction separated: "Who is X and what did Y do and how did Z happen?"
    - Mixed formats with proper capitalization and punctuation
    """
    
    def __init__(self):
        # Question word patterns (case insensitive)
        self.question_words = [
            'who', 'what', 'where', 'when', 'why', 'how', 
            'which', 'whose', 'whom', 'is', 'are', 'was', 'were',
            'does', 'do', 'did', 'can', 'could', 'will', 'would',
            'should', 'shall', 'may', 'might', 'has', 'have', 'had'
        ]
        
        # Compile regex patterns for efficient matching
        self.question_patterns = self._compile_patterns()
        
    def _compile_patterns(self) -> List[re.Pattern]:
        """Compile regex patterns for different question splitting scenarios."""
        patterns = []
        
        # Pattern 1: Questions separated by question marks
        # "Who is X? What did Y do? How did Z happen?"
        patterns.append(re.compile(r'([^?]+\?)', re.IGNORECASE))
        
        # Pattern 2: Questions connected by "and" or "," with question words
        # "Who is X and what did Y do and how did Z happen?"
        question_word_pattern = '|'.join(self.question_words)
        patterns.append(re.compile(
            rf'\b({question_word_pattern})\s+[^?]*?(?=\s+(?:and\s+)?(?:{question_word_pattern})\b|\?|$)',
            re.IGNORECASE
        ))
        
        return patterns
    
    def detect_multi_question(self, text: str) -> bool:
        """
        Detect if the input text contains multiple questions.
        
        Args:
            text: Input text to analyze
            
        Returns:
            bool: True if multiple questions are detected
        """
        text = text.strip()
        
        # Count question marks
        question_marks = text.count('?')
        if question_marks > 1:
            return True
            
        # Count question words at the beginning of potential questions
        question_word_pattern = '|'.join(self.question_words)
        question_starts = re.findall(
            rf'\b({question_word_pattern})\s+',
            text,
            re.IGNORECASE
        )
        
        # If we have multiple question words and conjunctions, likely multi-question
        if len(question_starts) > 1 and (' and ' in text.lower() or ', ' in text):
            return True
            
        return False
    
    def split_questions(self, text: str) -> List[SplitQuestion]:
        """
        Split a multi-question prompt into individual questions.
        
        Args:
            text: Input text containing multiple questions
            
        Returns:
            List[SplitQuestion]: List of individual questions with metadata
        """
        text = text.strip()
        
        # If it's not a multi-question prompt, return as single question
        if not self.detect_multi_question(text):
            return [SplitQuestion(
                question=text,
                original_index=0,
                confidence=1.0,
                question_type=self._classify_question_type(text)
            )]
        
        questions = []
        
        # Try pattern-based splitting
        for pattern in self.question_patterns:
            matches = pattern.findall(text)
            if matches:
                questions = self._process_pattern_matches(matches, text)
                break
        
        # If no pattern matches, try fallback splitting
        if not questions:
            questions = self._fallback_split(text)
        
        # Clean and validate questions
        questions = self._clean_and_validate_questions(questions)
        
        return questions
    
    def _process_pattern_matches(self, matches: List[str], original_text: str) -> List[SplitQuestion]:
        """Process regex pattern matches into SplitQuestion objects."""
        questions = []
        
        for i, match in enumerate(matches):
            cleaned_question = self._clean_question(match)
            if cleaned_question:
                questions.append(SplitQuestion(
                    question=cleaned_question,
                    original_index=i,
                    confidence=0.9,
                    question_type=self._classify_question_type(cleaned_question)
                ))
        
        return questions
    
    def _fallback_split(self, text: str) -> List[SplitQuestion]:
        """
        Fallback splitting method for complex cases.
        Splits on conjunctions and question words.
        """
        questions = []
        
        # Split on common conjunctions and then look for question words
        potential_splits = re.split(r'\s+and\s+|\s*,\s*and\s+|\s*;\s*', text, flags=re.IGNORECASE)
        
        for i, split in enumerate(potential_splits):
            split = split.strip()
            if split and self._has_question_word(split):
                # Ensure proper capitalization
                split = self._ensure_proper_capitalization(split)
                # Ensure question mark
                if not split.endswith('?'):
                    split += '?'
                
                questions.append(SplitQuestion(
                    question=split,
                    original_index=i,
                    confidence=0.7,
                    question_type=self._classify_question_type(split)
                ))
        
        return questions
    
    def _clean_question(self, question: str) -> str:
        """Clean and format a question string."""
        question = question.strip()
        
        # Remove extra whitespace
        question = re.sub(r'\s+', ' ', question)
        
        # Ensure proper capitalization
        question = self._ensure_proper_capitalization(question)
        
        # Ensure question mark
        if question and not question.endswith('?'):
            question += '?'
        
        return question
    
    def _ensure_proper_capitalization(self, text: str) -> str:
        """Ensure the first letter is capitalized."""
        if text:
            return text[0].upper() + text[1:] if len(text) > 1 else text.upper()
        return text
    
    def _has_question_word(self, text: str) -> bool:
        """Check if text starts with a question word."""
        text_lower = text.lower().strip()
        for word in self.question_words:
            if text_lower.startswith(word + ' ') or text_lower == word:
                return True
        return False
    
    def _classify_question_type(self, question: str) -> str:
        """Classify the type of question based on its starting word."""
        question_lower = question.lower().strip()
        
        for word in ['who', 'what', 'where', 'when', 'why', 'how', 'which', 'whose', 'whom']:
            if question_lower.startswith(word + ' '):
                return word
        
        for word in ['is', 'are', 'was', 'were']:
            if question_lower.startswith(word + ' '):
                return 'is'
                
        for word in ['does', 'do', 'did']:
            if question_lower.startswith(word + ' '):
                return 'does'
        
        return 'other'
    
    def _clean_and_validate_questions(self, questions: List[SplitQuestion]) -> List[SplitQuestion]:
        """Clean and validate the list of questions."""
        validated_questions = []
        
        for question in questions:
            # Skip very short questions (likely parsing errors)
            if len(question.question.strip()) < 5:
                continue
            
            # Skip questions that don't have question words
            if not self._has_question_word(question.question):
                continue
            
            validated_questions.append(question)
        
        return validated_questions
    
    def format_questions_for_display(self, questions: List[SplitQuestion]) -> str:
        """Format split questions for display/logging."""
        if not questions:
            return "No questions found"
        
        if len(questions) == 1:
            return f"Single question: {questions[0].question}"
        
        formatted = f"Split into {len(questions)} questions:\n"
        for i, q in enumerate(questions, 1):
            formatted += f"{i}. {q.question}\n"
        
        return formatted.strip()

def create_question_splitter() -> QuestionSplitter:
    """Factory function to create a QuestionSplitter instance."""
    return QuestionSplitter()
