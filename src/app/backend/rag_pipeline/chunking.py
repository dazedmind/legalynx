# rag_pipeline/chunking.py - True Multi-Granularity Implementation

from typing import List
from llama_index.core import Document
from llama_index.core.schema import TextNode
from llama_index.core.text_splitter import SentenceSplitter
from llama_index.core.node_parser import SimpleNodeParser
from rag_pipeline.config import rag_config

def multi_granularity_chunking(documents: List[Document], pdf_path: str, text_threshold: int = 100) -> List[TextNode]:
    """
    Generate true multi-granularity chunks - same content at different chunk sizes.
    Also includes the original hierarchical approach for backward compatibility.
    
    This creates:
    1. Small chunks (256 tokens) - fine-grained context
    2. Medium chunks (512 tokens) - balanced context  
    3. Large chunks (1024 tokens) - broad context
    4. Logical chunks - structural sections
    """
    # Since we removed OCR, treat all documents as structured
    is_scanned = False  # Always False since we don't support scanned PDFs
    
    fine_nodes = []
    coarse_nodes = []
    logical_nodes = []

    # =======================
    # TRUE MULTI-GRANULARITY: Same content at different sizes
    # =======================
    for i, doc in enumerate(documents):
        text = doc.text

        # Create multiple chunk sizes of the SAME content
        # Small chunks (256 tokens)
        small_splitter = SentenceSplitter(
            chunk_size=rag_config["fine_chunk_size"],
            chunk_overlap=rag_config["fine_chunk_overlap"]
        )
        small_chunks = small_splitter.get_nodes_from_documents([doc])

        # Medium chunks (512 tokens) - same content, larger context
        medium_splitter = SentenceSplitter(
            chunk_size=512,  # Between fine and coarse
            chunk_overlap=50   # Proportional overlap
        )
        medium_chunks = medium_splitter.get_nodes_from_documents([doc])

        # Large chunks (1024 tokens) - same content, largest context
        large_splitter = SentenceSplitter(
            chunk_size=rag_config["coarse_chunk_size"],
            chunk_overlap=100  # Larger overlap for context preservation
        )
        large_chunks = large_splitter.get_nodes_from_documents([doc])

        # Tag each chunk with granularity level and page info
        for node in small_chunks:
            node.metadata["chunk_type"] = "fine"
            node.metadata["granularity"] = "small"
            node.metadata["page_number"] = i + 1

        for node in medium_chunks:
            node.metadata["chunk_type"] = "medium"  # New granularity level
            node.metadata["granularity"] = "medium"
            node.metadata["page_number"] = i + 1

        for node in large_chunks:
            node.metadata["chunk_type"] = "coarse"
            node.metadata["granularity"] = "large"
            node.metadata["page_number"] = i + 1

        # Add to respective collections (keeping original structure)
        fine_nodes.extend(small_chunks)
        coarse_nodes.extend(large_chunks)

        # Add medium chunks to fine_nodes for retrieval (or create separate category)
        fine_nodes.extend(medium_chunks)

    # =======================
    # ORIGINAL HIERARCHICAL APPROACH: Different content types
    # =======================
    # Logical chunking for structured documents (enhanced for legal documents)
    for doc in documents:
        lines = doc.text.split("\n")
        current_chunk = []
        collecting = False
        section_title = None

        for line in lines:
            line_strip = line.strip()

            # Enhanced section detection for legal documents
            if any(anchor in line_strip.upper() for anchor in [
                # Contract sections
                "TERMS AND CONDITIONS",
                "SCOPE OF WORK", 
                "PAYMENT TERMS",
                "MATERIALS, COST, AND DISBURSEMENTS",
                "INDEMNITY",
                "LIABILITY",
                "APPLICABLE LAWS",
                "GOVERNING LAW",
                "JURISDICTION",
                "TERMINATION",
                "CONFIDENTIALITY",
                "INTELLECTUAL PROPERTY",
                "WARRANTIES",
                "FORCE MAJEURE",
                "DISPUTE RESOLUTION",
                "ARBITRATION",
                "REMEDIES",
                "OBLIGATIONS",
                "REPRESENTATIONS",
                "COVENANTS",
                "DEFAULT",
                "BREACH",
                "SEVERABILITY",
                "ENTIRE AGREEMENT",
                "AMENDMENTS",
                "NOTICES",
                "ASSIGNMENT",
                
                # Additional legal document sections
                "RECITALS",
                "WHEREAS",
                "NOW THEREFORE",
                "DEFINITIONS",
                "INTERPRETATION",
                "CONSIDERATION",
                "PERFORMANCE",
                "DELIVERY",
                "ACCEPTANCE",
                "TITLE",
                "RISK OF LOSS",
                "INSURANCE",
                "COMPLIANCE",
                "REGULATORY",
                "AUDIT",
                "RECORDS",
                "DISCLOSURE",
                "NON-DISCLOSURE",
                "PROPRIETARY",
                "TRADE SECRETS",
                "COPYRIGHT",
                "PATENT",
                "TRADEMARK",
                "LICENSE",
                "SUBLICENSE",
                "ROYALTY",
                "FEES",
                "EXPENSES",
                "COSTS",
                "INVOICING",
                "BILLING",
                "COLLECTION",
                "LATE PAYMENT",
                "INTEREST",
                "CURRENCY",
                "TAXES",
                "WITHHOLDING",
                "FORCE MAJEURE",
                "ACT OF GOD",
                "IMPOSSIBILITY",
                "FRUSTRATION",
                "HARDSHIP",
                "SUSPENSION",
                "CANCELLATION",
                "RESCISSION",
                "MODIFICATION",
                "WAIVER",
                "CONSENT",
                "APPROVAL",
                "AUTHORIZATION",
                "DELEGATION",
                "SUBCONTRACTING",
                "THIRD PARTIES",
                "BENEFICIARIES",
                "SUCCESSORS",
                "ASSIGNS",
                "HEIRS",
                "EXECUTORS",
                "ADMINISTRATORS",
                "SURVIVAL",
                "INTEGRATION",
                "COUNTERPARTS",
                "ELECTRONIC SIGNATURES",
                "FACSIMILE",
                "HEADINGS",
                "CONSTRUCTION",
                "INVALIDITY",
                "ENFORCEABILITY",
                "CHOICE OF LAW",
                "VENUE",
                "FORUM",
                "SERVICE OF PROCESS",
                "LIMITATION OF LIABILITY",
                "CONSEQUENTIAL DAMAGES",
                "PUNITIVE DAMAGES",
                "LIQUIDATED DAMAGES",
                "MITIGATION",
                "CURE",
                "NOTICE OF DEFAULT",
                "OPPORTUNITY TO CURE",
                "SPECIFIC PERFORMANCE",
                "INJUNCTIVE RELIEF",
                "ATTORNEY FEES",
                "COSTS OF COLLECTION",
                "PREVAILING PARTY"
            ]):
                if current_chunk:
                    chunk_text = "\n".join(current_chunk)
                    logical_nodes.append(TextNode(
                        text=chunk_text,
                        metadata={
                            "section": section_title,
                            "chunk_type": "logical",
                            "granularity": "structural"
                        }
                    ))
                    current_chunk = []

                collecting = True
                section_title = line_strip
                current_chunk = [line_strip]
                continue

            if collecting:
                if line_strip == "" and current_chunk:
                    chunk_text = "\n".join(current_chunk)
                    logical_nodes.append(TextNode(
                        text=chunk_text,
                        metadata={
                            "section": section_title,
                            "chunk_type": "logical",
                            "granularity": "structural"
                        }
                    ))
                    current_chunk = []
                    collecting = False
                else:
                    current_chunk.append(line_strip)

        # Add remaining chunk
        if current_chunk:
            chunk_text = "\n".join(current_chunk)
            logical_nodes.append(TextNode(
                text=chunk_text,
                metadata={
                    "section": section_title,
                    "chunk_type": "logical",
                    "granularity": "structural"
                }
            ))

    # Print summary for verification
    total_fine = len([n for n in fine_nodes if n.metadata.get("granularity") == "small"])
    total_medium = len([n for n in fine_nodes if n.metadata.get("granularity") == "medium"])
    total_coarse = len(coarse_nodes)
    total_logical = len(logical_nodes)

    print(f"✅ True Multi-Granularity Chunks:")
    print(f"   - Small (256): {total_fine}")
    print(f"   - Medium (512): {total_medium}")
    print(f"   - Large (1024): {total_coarse}")
    print(f"   - Logical/Structural: {total_logical}")
    print(f"   - Total: {len(fine_nodes + coarse_nodes + logical_nodes)}")

    return fine_nodes + coarse_nodes + logical_nodes

def create_semantic_chunks(documents: List[Document], chunk_size: int = 512, 
                          chunk_overlap: int = 50) -> List[TextNode]:
    """
    Create semantic chunks using sentence-based splitting.
    Alternative chunking method for different use cases.
    """
    splitter = SentenceSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    
    nodes = []
    for doc in documents:
        doc_nodes = splitter.get_nodes_from_documents([doc])
        for node in doc_nodes:
            node.metadata["chunk_type"] = "semantic"
            node.metadata.update(doc.metadata)
        nodes.extend(doc_nodes)
    
    return nodes