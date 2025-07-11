from typing import List
from llama_index.core import Document
from llama_index.core.schema import TextNode
from llama_index.core.text_splitter import SentenceSplitter
from llama_index.core.node_parser import SimpleNodeParser
from rag_pipeline.config import rag_config
from utils.file_handler import is_scanned_pdf


def multi_granularity_chunking(documents: List[Document], pdf_path: str, 
                              text_threshold: int = 100) -> List[TextNode]:
    """
    Generate fine, coarse, and logical chunks with separate strategies for structured and scanned PDFs.
    - Retains precise section titles for structured PDFs.
    - Simplifies chunking for scanned PDFs to reduce noise.
    """
    # Check if the document is scanned
    is_scanned = is_scanned_pdf(pdf_path, text_threshold=text_threshold)

    fine_nodes = []
    coarse_nodes = []
    logical_nodes = []

    # Fine-grained chunking (sentence-level)
    sentence_splitter = SentenceSplitter(
        chunk_size=rag_config["fine_chunk_size"],
        chunk_overlap=rag_config["fine_chunk_overlap"]
    )
    for i, doc in enumerate(documents):
        nodes = sentence_splitter.get_nodes_from_documents([doc])
        for node in nodes:
            node.metadata["chunk_type"] = "fine"
            node.metadata["page_number"] = i + 1
        fine_nodes.extend(nodes)

    # Coarse-grained chunking (paragraph-level)
    coarse_parser = SimpleNodeParser.from_defaults(
        chunk_size=rag_config["coarse_chunk_size"]
    )
    for i, doc in enumerate(documents):
        nodes = coarse_parser.get_nodes_from_documents([doc])
        for node in nodes:
            node.metadata["chunk_type"] = "coarse"
            node.metadata["page_number"] = i + 1
        coarse_nodes.extend(nodes)

    # Logical chunking (Structured PDFs)
    if not is_scanned:
        logical_nodes = _logical_chunking_structured(documents)
    else:
        logical_nodes = _logical_chunking_scanned(documents)

    # Print summary for verification
    print(f"✅ Final Chunk Counts - Fine: {len(fine_nodes)}, Coarse: {len(coarse_nodes)}, Logical: {len(logical_nodes)}")

    return fine_nodes + coarse_nodes + logical_nodes


def _logical_chunking_structured(documents: List[Document]) -> List[TextNode]:
    """
    Logical chunking for structured PDFs with section detection.
    """
    logical_nodes = []
    
    for doc in documents:
        lines = doc.text.split("\n")
        current_chunk = []
        collecting = False
        section_title = None

        for line in lines:
            line_strip = line.strip()

            # Detect known section headers
            if any(anchor in line_strip.upper() for anchor in [
                "TOTAL ESTIMATED MONTHLY PAYMENT",
                "FEES WORKSHEET",
                "ORIGINATION CHARGES",
                "OTHER CHARGES"
            ]):
                if current_chunk:
                    chunk_text = "\n".join(current_chunk)
                    logical_nodes.append(TextNode(
                        text=chunk_text, 
                        metadata={"section": section_title, "chunk_type": "logical"}
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
                        metadata={"section": section_title, "chunk_type": "logical"}
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
                metadata={"section": section_title, "chunk_type": "logical"}
            ))
    
    return logical_nodes


def _logical_chunking_scanned(documents: List[Document]) -> List[TextNode]:
    """
    Simplified logical chunking for scanned PDFs.
    """
    logical_nodes = []
    
    for doc in documents:
        lines = doc.text.split("\n")
        current_chunk = []
        for line in lines:
            line_strip = line.strip()
            if line_strip:
                current_chunk.append(line_strip)
        
        if current_chunk:
            logical_nodes.append(TextNode(
                text="\n".join(current_chunk),
                metadata={"chunk_type": "logical"}
            ))
    
    return logical_nodes


def create_semantic_chunks(documents: List[Document], chunk_size: int = 512, 
                          chunk_overlap: int = 50) -> List[TextNode]:
    """
    Create semantic chunks using sentence-based splitting.
    """
    splitter = SentenceSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    
    all_nodes = []
    for doc in documents:
        nodes = splitter.get_nodes_from_documents([doc])
        for node in nodes:
            node.metadata["chunk_type"] = "semantic"
        all_nodes.extend(nodes)
    
    return all_nodes


def create_page_level_chunks(documents: List[Document]) -> List[TextNode]:
    """
    Create page-level chunks for coarse-grained retrieval.
    """
    page_nodes = []
    
    for doc in documents:
        node = TextNode(
            text=doc.text,
            metadata={
                **doc.metadata,
                "chunk_type": "page"
            }
        )
        page_nodes.append(node)
    
    return page_nodes