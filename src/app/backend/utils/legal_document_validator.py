"""
Legal Document Validator
========================
Lightweight validation to determine if an uploaded document is legal-related.

Features:
- Fast text-based heuristics (< 1 second)
- Legal terminology and pattern matching
- Document structure analysis
- Minimal latency impact on RAG pipeline

Author: Legalynx Team
"""

import re
from typing import Dict, List, Tuple
from llama_index.core import Document


class LegalDocumentValidator:
    """
    Validates whether a document is legal-related using multiple heuristic strategies.
    """
    
    # Legal document keywords (weighted by importance)
    LEGAL_KEYWORDS_HIGH_WEIGHT = {
        # Contract-related
        'whereas', 'wherefore', 'heretofore', 'hereinafter', 'aforementioned',
        'party of the first part', 'party of the second part',
        
        # Court-related
        'plaintiff', 'defendant', 'appellant', 'appellee', 'petitioner', 'respondent',
        'court order', 'motion to', 'complaint', 'summons', 'subpoena',
        'deposition', 'affidavit', 'sworn statement', 'testimony',
        
        # Legal proceedings
        'pursuant to', 'in accordance with', 'stipulated', 'jurisdiction',
        'habeas corpus', 'prima facie', 'res judicata', 'voir dire',
        
        # Contract clauses
        'force majeure', 'indemnification', 'arbitration clause',
        'non-disclosure', 'confidentiality agreement', 'severability',
        
        # Legal actions
        'hereby', 'witnesseth', 'executed', 'covenant', 'obligated',
        'liable', 'tort', 'negligence', 'breach of contract',
    }
    
    LEGAL_KEYWORDS_MEDIUM_WEIGHT = {
        'contract', 'agreement', 'legal', 'law', 'attorney', 'counsel',
        'court', 'judge', 'justice', 'trial', 'hearing', 'litigation',
        'statute', 'regulation', 'ordinance', 'constitutional',
        'rights', 'obligations', 'terms and conditions', 'liability',
        'damages', 'settlement', 'verdict', 'judgment', 'decree',
        'lease', 'deed', 'will', 'testament', 'probate', 'estate',
        'patent', 'trademark', 'copyright', 'intellectual property',
        'merger', 'acquisition', 'securities', 'compliance',
        'arbitration', 'mediation', 'dispute resolution',
        'memorandum of understanding', 'power of attorney',
        'notary', 'witness', 'signature', 'seal',
    }
    
    LEGAL_KEYWORDS_LOW_WEIGHT = {
        'provision', 'clause', 'section', 'article', 'exhibit',
        'schedule', 'appendix', 'amendment', 'addendum',
        'effective date', 'termination', 'notice', 'waiver',
        'consent', 'approval', 'authorization', 'representation',
        'warranty', 'guarantee', 'insurance', 'premium',
        'penalty', 'fine', 'fee', 'compensation', 'payment',
        'party', 'parties', 'entity', 'corporation', 'partnership',
    }
    
    # Legal document patterns (regex)
    LEGAL_PATTERNS = [
        # Case citations (e.g., "123 F.3d 456", "321 U.S. 789")
        r'\d+\s+[A-Z]\.\s*\d*d?\s+\d+',
        
        # Legal references (e.g., "§ 123", "Section 4.5")
        r'§+\s*\d+(\.\d+)*',
        r'[Ss]ection\s+\d+(\.\d+)*',
        r'[Aa]rticle\s+[IVXLCDM]+',
        
        # Date formats common in legal documents
        r'day of [A-Z][a-z]+,?\s+\d{4}',
        r'executed on|dated as of|effective as of',
        
        # Legal document headers
        r'IN THE [A-Z\s]+ COURT',
        r'UNITED STATES DISTRICT COURT',
        r'STATE OF [A-Z\s]+',
        r'THIS [A-Z\s]+ AGREEMENT',
        
        # Common legal phrases
        r'NOW, THEREFORE',
        r'WITNESSETH:?',
        r'IN WITNESS WHEREOF',
        r'KNOW ALL [A-Z\s]+ BY THESE PRESENTS',
        
        # Signature blocks
        r'SIGNED AND DELIVERED|EXECUTED BY|IN PRESENCE OF',
        r'___+\s*\n\s*Signature',
    ]
    
    # Non-legal indicators (reduce score)
    NON_LEGAL_INDICATORS = {
        # Scientific/Academic
        'abstract', 'methodology', 'hypothesis', 'experiment', 'results',
        'discussion', 'bibliography', 'references cited',
        
        # Technical
        'algorithm', 'database', 'software', 'hardware', 'api',
        'deployment', 'configuration', 'installation',
        
        # Marketing/Business (non-legal)
        'social media', 'marketing campaign', 'brand awareness',
        'customer engagement', 'conversion rate',
        
        # Medical (non-legal)
        'diagnosis', 'treatment', 'symptoms', 'patient history',
        'medical record', 'prescription',
        
        # General content
        'blog post', 'article', 'newsletter', 'press release',
        'tutorial', 'how-to guide', 'user manual',
    }
    
    # Legal document type indicators
    DOCUMENT_TYPE_PATTERNS = {
        'contract': r'(contract|agreement)\s+(between|by and between)',
        'lease': r'lease\s+agreement|landlord.*tenant',
        'will': r'last will and testament|testamentary',
        'power_of_attorney': r'power of attorney|attorney-in-fact',
        'affidavit': r'affidavit|sworn (statement|declaration)',
        'complaint': r'complaint\s+(for|against)|civil action',
        'motion': r'motion\s+(to|for)|notice of motion',
        'brief': r'(appellant|appellee).*brief|memorandum of law',
        'settlement': r'settlement agreement|release of claims',
        'nda': r'non-disclosure|confidentiality agreement',
        'employment': r'employment (contract|agreement)|offer letter',
        'corporate': r'(articles|certificate) of incorporation|bylaws',
    }
    
    @classmethod
    def validate_legal_document(
        cls,
        documents: List[Document],
        threshold: float = 0.3,
        verbose: bool = True
    ) -> Dict:
        """
        Validate if documents are legal-related.
        
        Args:
            documents: List of Document objects extracted from PDF
            threshold: Confidence threshold (0.0-1.0) for legal classification
            verbose: Whether to print detailed validation info
            
        Returns:
            dict: {
                "is_legal": bool,
                "confidence": float,
                "document_type": str or None,
                "details": dict with scoring breakdown,
                "rejection_reason": str or None
            }
        """
        # Combine all document text
        full_text = " ".join([doc.text for doc in documents])
        
        # Normalize text for analysis
        text_lower = full_text.lower()
        text_length = len(full_text.split())
        
        if text_length < 50:
            return {
                "is_legal": False,
                "confidence": 0.0,
                "document_type": None,
                "details": {"error": "Document too short for reliable classification"},
                "rejection_reason": "Document is too short (less than 50 words). Please upload a complete legal document."
            }
        
        # Calculate scores
        scores = {
            "keyword_high": 0,
            "keyword_medium": 0,
            "keyword_low": 0,
            "pattern_matches": 0,
            "non_legal_penalty": 0,
            "document_type": None
        }
        
        # 1. High-weight keyword matching
        for keyword in cls.LEGAL_KEYWORDS_HIGH_WEIGHT:
            if keyword in text_lower:
                scores["keyword_high"] += 1
        
        # 2. Medium-weight keyword matching
        for keyword in cls.LEGAL_KEYWORDS_MEDIUM_WEIGHT:
            if keyword in text_lower:
                scores["keyword_medium"] += 1
        
        # 3. Low-weight keyword matching
        for keyword in cls.LEGAL_KEYWORDS_LOW_WEIGHT:
            if keyword in text_lower:
                scores["keyword_low"] += 1
        
        # 4. Pattern matching
        for pattern in cls.LEGAL_PATTERNS:
            matches = re.findall(pattern, full_text, re.IGNORECASE | re.MULTILINE)
            scores["pattern_matches"] += len(matches)
        
        # 5. Check for non-legal indicators
        for indicator in cls.NON_LEGAL_INDICATORS:
            if indicator in text_lower:
                scores["non_legal_penalty"] += 1
        
        # 6. Identify document type
        detected_types = []
        for doc_type, pattern in cls.DOCUMENT_TYPE_PATTERNS.items():
            if re.search(pattern, text_lower, re.IGNORECASE):
                detected_types.append(doc_type)
        
        if detected_types:
            scores["document_type"] = detected_types[0]
        
        # Calculate weighted confidence score
        confidence = cls._calculate_confidence(scores, text_length)
        
        # Determine if document is legal
        is_legal = confidence >= threshold
        
        # Generate rejection reason if not legal
        rejection_reason = None
        if not is_legal:
            if scores["non_legal_penalty"] > 10:
                rejection_reason = (
                    "This document appears to be non-legal content (technical, academic, or marketing material). "
                    "Please upload legal documents such as contracts, court filings, legal memos, or other legal materials."
                )
            elif confidence < 0.15:
                rejection_reason = (
                    "Legalynx is designed for legal documents such as contracts, agreements, court decisions, "
                    "affidavits, legal memos, and similar legal materials. Please upload a legal document."
                )
            else:
                rejection_reason = (
                    "The document may not be legal-related. Please ensure you're uploading legal documents "
                    "such as contracts, court filings, legal briefs, or legal correspondence."
                )
        
        result = {
            "is_legal": is_legal,
            "confidence": confidence,
            "document_type": scores["document_type"],
            "details": scores,
            "rejection_reason": rejection_reason
        }
        
        # Verbose output
        if verbose:
            cls._print_validation_report(result, text_length)
        
        return result
    
    @staticmethod
    def _calculate_confidence(scores: Dict, text_length: int) -> float:
        """
        Calculate confidence score based on weighted factors.
        
        Scoring formula:
        - High-weight keywords: 3 points each
        - Medium-weight keywords: 1.5 points each
        - Low-weight keywords: 0.5 points each
        - Pattern matches: 2 points each
        - Non-legal penalty: -2 points each
        - Document type identified: +10 bonus points
        
        Normalized by text length to account for document size.
        """
        raw_score = (
            scores["keyword_high"] * 3.0 +
            scores["keyword_medium"] * 1.5 +
            scores["keyword_low"] * 0.5 +
            scores["pattern_matches"] * 2.0 -
            scores["non_legal_penalty"] * 2.0
        )
        
        # Bonus for identified document type
        if scores["document_type"]:
            raw_score += 10
        
        # Normalize by text length (per 100 words)
        normalized_score = raw_score / max(text_length / 100, 1)
        
        # Convert to 0-1 confidence scale (cap at 1.0)
        # A score of 5 or higher indicates strong legal content
        confidence = min(normalized_score / 5.0, 1.0)
        
        return max(confidence, 0.0)
    
    @staticmethod
    def _print_validation_report(result: Dict, text_length: int):
        """Print detailed validation report."""
        print("\n" + "=" * 80)
        print("🔍 LEGAL DOCUMENT VALIDATION REPORT")
        print("=" * 80)
        print(f"📊 Document Length: {text_length} words")
        print(f"✅ Is Legal: {result['is_legal']}")
        print(f"📈 Confidence: {result['confidence']:.2%}")
        print(f"📝 Document Type: {result['document_type'] or 'Not identified'}")
        print(f"\n📋 Scoring Details:")
        print(f"   High-weight keywords: {result['details']['keyword_high']}")
        print(f"   Medium-weight keywords: {result['details']['keyword_medium']}")
        print(f"   Low-weight keywords: {result['details']['keyword_low']}")
        print(f"   Pattern matches: {result['details']['pattern_matches']}")
        print(f"   Non-legal indicators: {result['details']['non_legal_penalty']}")
        
        if not result['is_legal']:
            print(f"\n❌ Rejection Reason:")
            print(f"   {result['rejection_reason']}")
        
        print("=" * 80 + "\n")


# ================================
# CONVENIENCE FUNCTION
# ================================

def validate_legal_document(
    documents: List[Document],
    threshold: float = 0.3,
    verbose: bool = True
) -> Dict:
    """
    Convenience function for legal document validation.
    
    Args:
        documents: List of Document objects from PDF extraction
        threshold: Confidence threshold (default: 0.3)
        verbose: Print validation details (default: True)
    
    Returns:
        dict with validation results
    """
    return LegalDocumentValidator.validate_legal_document(
        documents=documents,
        threshold=threshold,
        verbose=verbose
    )


# ================================
# TESTING UTILITIES
# ================================

if __name__ == "__main__":
    # Test with sample legal text
    from llama_index.core import Document
    
    legal_sample = Document(
        text="""
        EMPLOYMENT AGREEMENT
        
        THIS AGREEMENT is made and entered into as of January 1, 2024, by and between
        ABC Corporation, a Delaware corporation (hereinafter referred to as "Employer"), 
        and John Doe (hereinafter referred to as "Employee").
        
        WHEREAS, Employer desires to employ Employee, and Employee desires to accept 
        employment with Employer, upon the terms and conditions set forth herein;
        
        NOW, THEREFORE, in consideration of the mutual covenants and agreements 
        hereinafter set forth, the parties hereby agree as follows:
        
        1. EMPLOYMENT. Employer hereby employs Employee, and Employee hereby accepts 
        employment with Employer, upon the terms and conditions set forth in this Agreement.
        
        2. DUTIES. Employee shall perform such duties as are customarily associated with 
        the position of Senior Software Engineer, and such other duties as may be assigned 
        by Employer from time to time.
        
        3. COMPENSATION. As compensation for services rendered hereunder, Employer shall 
        pay Employee an annual salary of $120,000, payable in accordance with Employer's 
        standard payroll practices.
        
        IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first 
        written above.
        """
    )
    
    non_legal_sample = Document(
        text="""
        How to Bake the Perfect Chocolate Cake
        
        Introduction:
        Baking a chocolate cake is both an art and a science. In this tutorial, we'll 
        walk through the steps to create a delicious, moist chocolate cake that will 
        impress your friends and family.
        
        Ingredients:
        - 2 cups all-purpose flour
        - 2 cups sugar
        - 3/4 cup cocoa powder
        - 2 teaspoons baking soda
        - 1 teaspoon salt
        - 2 eggs
        - 1 cup buttermilk
        
        Instructions:
        1. Preheat your oven to 350°F (175°C).
        2. Mix all dry ingredients in a large bowl.
        3. Add eggs and buttermilk, stirring until smooth.
        4. Pour into greased cake pans.
        5. Bake for 30-35 minutes or until a toothpick comes out clean.
        
        Tips:
        Make sure not to overmix the batter, as this can result in a dense cake.
        For best results, use room temperature ingredients.
        """
    )
    
    print("Testing Legal Document:")
    result1 = validate_legal_document([legal_sample])
    
    print("\nTesting Non-Legal Document:")
    result2 = validate_legal_document([non_legal_sample])

