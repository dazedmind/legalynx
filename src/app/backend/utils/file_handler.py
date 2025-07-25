import os
import fitz
import shutil
from typing import List, Optional, Dict, Any
from llama_index.core import Document
from datetime import datetime
import re
import os

# DOCX text extraction
try:
    from docx import Document as DocxDocument
    DOCX_TEXT_EXTRACTION = True
    print("✅ DOCX text extraction available (python-docx)")
except ImportError:
    DOCX_TEXT_EXTRACTION = False
    print("⚠️ DOCX text extraction not available - install python-docx")

def extract_text_from_docx(docx_path: str) -> List[Document]:
    """
    Extract text directly from DOCX without conversion to PDF.
    This is the most reliable method when PDF conversion fails.
    """
    if not DOCX_TEXT_EXTRACTION:
        raise Exception("python-docx not installed. Install with: pip install python-docx")
    
    print("📄 Extracting text directly from DOCX...")
    documents = []
    
    try:
        # Load DOCX document
        doc = DocxDocument(docx_path)
        
        # Extract text from all paragraphs
        full_text = []
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                full_text.append(paragraph.text.strip())
        
        # Extract text from tables
        table_text = []
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                if row_text:
                    table_text.append(row_text)
        
        # Combine all text
        all_content = full_text + table_text
        combined_text = "\n".join(all_content)
        
        if not combined_text.strip():
            combined_text = "No extractable text found in DOCX document."
        
        # Create a single document (DOCX doesn't have pages like PDF)
        documents.append(Document(
            text=combined_text,
            metadata={
                "file_name": os.path.basename(docx_path),
                "page_number": 1,
                "total_pages": 1,
                "extraction_method": "docx_direct",
                "original_format": "docx",
                "paragraph_count": len(full_text),
                "table_count": len([t for t in doc.tables])
            }
        ))
        
        print(f"✅ Successfully extracted text from DOCX")
        print(f"📊 Total characters extracted: {len(combined_text)}")
        print(f"📄 Paragraphs: {len(full_text)}, Tables: {len([t for t in doc.tables])}")
        
        return documents
        
    except Exception as e:
        print(f"❌ Error extracting text from DOCX: {e}")
        raise Exception(f"Failed to extract text from DOCX: {str(e)}")

def get_next_sequential_number(upload_dir: str, title: Optional[str] = None, client_name: Optional[str] = None) -> int:
    """
    Get the next sequential number for file naming.
    """
    if not title or not client_name:
        return 1
    
    # Create the pattern to search for
    pattern = f"{title}_{client_name}_"
    
    # Ensure directory exists
    os.makedirs(upload_dir, exist_ok=True)
    
    # Find existing files with this pattern
    existing_numbers = []
    for filename in os.listdir(upload_dir):
        if filename.startswith(pattern):
            # Extract the number part
            try:
                # Get the part after the last underscore and before the extension
                name_without_ext = os.path.splitext(filename)[0]
                number_part = name_without_ext.split('_')[-1]
                if number_part.isdigit():
                    existing_numbers.append(int(number_part))
            except (ValueError, IndexError):
                continue
    
    # Return the next number
    return max(existing_numbers) + 1 if existing_numbers else 1

def generate_filename(
    original_filename: str,
    naming_option: str,
    title: Optional[str] = None,
    client_name: Optional[str] = None,
    counter: Optional[int] = None
) -> str:
    """
    Generate filename based on naming option and user settings.
    """
    # Get file extension
    file_ext = os.path.splitext(original_filename)[1].lower()
    
    def clean_for_filename(text: str) -> str:
        """Clean text to be safe for filenames"""
        if not text:
            return ""
        # Remove or replace problematic characters
        cleaned = re.sub(r'[^\w\-_\.]', '_', text)
        cleaned = re.sub(r'_+', '_', cleaned)  # Replace multiple underscores with single
        return cleaned.strip('_')
    
    if naming_option == "keep_original":
        return original_filename
    
    elif naming_option == "add_timestamp":
        if not title or not client_name:
            print("⚠️ Missing title or client_name for timestamp naming, using original")
            return original_filename
        
        # Format: TITLE_CLIENTNAME_YYYY-MM-DD.ext
        date_str = datetime.now().strftime("%Y-%m-%d")
        clean_title = clean_for_filename(title)
        clean_client = clean_for_filename(client_name)
        return f"{clean_title}_{clean_client}_{date_str}{file_ext}"
    
    elif naming_option == "sequential_numbering":
        if not title or not client_name:
            print("⚠️ Missing title or client_name for sequential naming, using original")
            return original_filename
        
        # Use provided counter or default to 001
        number = counter if counter is not None else 1
        clean_title = clean_for_filename(title)
        clean_client = clean_for_filename(client_name)
        return f"{clean_title}_{clean_client}_{number:03d}{file_ext}"
    
    else:
        print(f"⚠️ Unknown naming option: {naming_option}, using original")
        return original_filename

def save_uploaded_file(
    file_content: bytes, 
    filename: str, 
    naming_option: str,  # REQUIRED - no default value
    upload_dir: str = "sample_docs",
    rag_system: Optional[Dict[str, Any]] = None,
    user_title: Optional[str] = None,
    user_client_name: Optional[str] = None,
    counter: Optional[int] = None
) -> str:
    """
    Save uploaded file with intelligent naming using RAG analysis.
    
    Args:
        file_content: The file content as bytes
        filename: Original filename
        naming_option: How to name the file (REQUIRED - from user settings)
        upload_dir: Directory to save the file
        rag_system: RAG system for intelligent naming (optional)
        user_title: User-provided title (fallback)
        user_client_name: User-provided client name (fallback)
        counter: Sequential counter for numbering
    
    Returns:
        str: Path to the saved file
    """
    print(f"🔧 File naming function called with:")
    print(f"   - naming_option: {naming_option}")
    print(f"   - user_title: {user_title}")
    print(f"   - user_client_name: {user_client_name}")
    print(f"   - rag_system available: {rag_system is not None}")
    
    # Create directory if it doesn't exist
    os.makedirs(upload_dir, exist_ok=True)
    
    # If no RAG system provided or keep_original, use simple naming
    if not rag_system or naming_option == "keep_original":
        print(f"📁 Using simple file naming (naming_option: {naming_option})...")
        
        # Generate filename using existing logic
        new_filename = generate_filename(
            original_filename=filename,
            naming_option=naming_option,
            title=user_title,
            client_name=user_client_name,
            counter=counter
        )
        
        # Create full file path
        file_path = os.path.join(upload_dir, new_filename)
        
        # Handle file conflicts
        if os.path.exists(file_path) and naming_option == "keep_original":
            base_name, ext = os.path.splitext(new_filename)
            conflict_counter = 1
            while os.path.exists(file_path):
                file_path = os.path.join(upload_dir, f"{base_name}_{conflict_counter}{ext}")
                conflict_counter += 1
            new_filename = os.path.basename(file_path)
            print(f"   Conflict resolved: {new_filename}")
        
        # Save the file
        try:
            with open(file_path, 'wb') as f:
                f.write(file_content)
            
            print(f"✅ File saved with simple naming:")
            print(f"   Original: {filename}")
            print(f"   Final: {new_filename}")
            print(f"   Path: {file_path}")
            print(f"   Size: {len(file_content)} bytes")
            
            return file_path
            
        except Exception as e:
            print(f"❌ Failed to save file: {e}")
            raise Exception(f"Failed to save file: {e}")
    
    else:
        # Use intelligent naming with RAG system
        print(f"🧠 Using intelligent file naming with RAG analysis (naming_option: {naming_option})...")
        
        # First save with temp name for RAG analysis
        temp_path = os.path.join(upload_dir, f"temp_{filename}")
        with open(temp_path, 'wb') as f:
            f.write(file_content)
        
        try:
            # Generate intelligent filename
            new_filename = generate_intelligent_filename_optimized(
                rag_system=rag_system,
                original_filename=filename,
                naming_option=naming_option,
                user_title=user_title,
                user_client_name=user_client_name,
                counter=counter
            )
            
            # Create final file path
            final_path = os.path.join(upload_dir, new_filename)
            
            # Handle file conflicts
            if os.path.exists(final_path) and final_path != temp_path:
                base_name, ext = os.path.splitext(new_filename)
                conflict_counter = 1
                while os.path.exists(final_path):
                    final_path = os.path.join(upload_dir, f"{base_name}_{conflict_counter}{ext}")
                    conflict_counter += 1
                new_filename = os.path.basename(final_path)
                print(f"🔄 Resolved naming conflict: {new_filename}")
            
            # Move from temp to final location
            if final_path != temp_path:
                shutil.move(temp_path, final_path)
            
            print(f"✅ File saved with intelligent naming:")
            print(f"   Original: {filename}")
            print(f"   Final: {new_filename}")
            print(f"   Path: {final_path}")
            
            return final_path
            
        except Exception as e:
            print(f"❌ Error in intelligent file naming: {e}")
            # Fallback: use original temp file
            fallback_path = os.path.join(upload_dir, filename)
            if temp_path != fallback_path:
                shutil.move(temp_path, fallback_path)
            print(f"⚠️ Using fallback filename: {filename}")
            return fallback_path
        finally:
            # Clean up temp file if it still exists
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except:
                    pass

# ================================
# OPTIMIZED SINGLE-QUERY NAMING
# ================================

def generate_intelligent_filename_optimized(
    rag_system: Dict[str, Any],
    original_filename: str,
    naming_option: str,
    user_title: Optional[str] = None,
    user_client_name: Optional[str] = None,
    counter: Optional[int] = None
) -> str:
    """
    ⚡ OPTIMIZED: Generate intelligent filename using SINGLE RAG query.
    Avoids rate limiting by making only 1 API call instead of 3.
    """
    file_ext = os.path.splitext(original_filename)[1].lower()
    
    if naming_option == "keep_original":
        return original_filename
    
    # For intelligent naming options, use RAG to analyze content
    if naming_option in ["add_timestamp", "sequential_numbering"]:
        try:
            print("🔍 Analyzing document content with SINGLE optimized query...")
            
            query_engine = rag_system.get("query_engine")
            if not query_engine:
                print("❌ No query engine found, using fallback naming")
                return generate_fallback_filename(original_filename, naming_option, user_title, user_client_name, counter)
            
            # ⚡ SINGLE COMBINED QUERY - Extracts all info at once
            print("🤖 Making single optimized query for all document information...")
            
            combined_query = """
            Extract key information from this document and respond in this EXACT format:

            DATE: [Any date found in YYYY-MM-DD format, or "NONE"]
            PERSON: [Main person/client name mentioned, or "NONE"]
            TYPE: [Document type like Contract/Agreement/Invoice/etc, or "NONE"]

            Only provide the requested information in the exact format above. No explanations.
            """
            
            try:
                # ⚡ SINGLE API CALL instead of 3 separate calls
                response = query_engine.query(combined_query).response.strip()
                extracted_info = parse_combined_response(response)
                
                print(f"📊 Single query results:")
                print(f"   - Date: {extracted_info.get('date')}")
                print(f"   - Person: {extracted_info.get('person')}")
                print(f"   - Type: {extracted_info.get('type')}")
                
            except Exception as e:
                print(f"⚠️ Single query failed: {e}, using fallback")
                extracted_info = {'date': None, 'person': None, 'type': None}
            
            # Generate filename from extracted information
            intelligent_filename = create_filename_from_extracted_info(
                extracted_info, 
                original_filename, 
                naming_option, 
                counter,
                user_title,
                user_client_name
            )
            
            print(f"✅ Generated intelligent filename: {intelligent_filename}")
            return intelligent_filename
            
        except Exception as e:
            print(f"❌ Error in optimized intelligent naming: {e}")
            print("⚠️ Falling back to user settings or original name")
            
    # Fallback to user-provided info or original name
    return generate_fallback_filename(original_filename, naming_option, user_title, user_client_name, counter)

def parse_combined_response(response: str) -> dict:
    """
    ⚡ OPTIMIZED: Parse single combined RAG response into components.
    Handles the structured response from the single query.
    """
    info = {'date': None, 'person': None, 'type': None}
    
    try:
        lines = response.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip().upper()
                value = value.strip()
                
                # Parse each component
                if key == 'DATE':
                    info['date'] = parse_date_from_response(value)
                elif key == 'PERSON':
                    info['person'] = parse_person_from_response(value)
                elif key == 'TYPE':
                    info['type'] = parse_type_from_response(value)
        
        print(f"📊 Parsed combined response:")
        print(f"   - Raw response: {response[:100]}...")
        print(f"   - Date parsed: {info['date']}")
        print(f"   - Person parsed: {info['person']}")
        print(f"   - Type parsed: {info['type']}")
        
        return info
        
    except Exception as e:
        print(f"❌ Error parsing combined response: {e}")
        print(f"❌ Raw response was: {response}")
        return {'date': None, 'person': None, 'type': None}

# ================================
# ENHANCED PARSING FUNCTIONS
# ================================

def parse_date_from_response(response: str) -> Optional[str]:
    """Parse date from RAG response with multiple fallback patterns."""
    if not response or response.upper() in ['NO_DATE', 'NONE', 'UNKNOWN', 'N/A']:
        return None
    
    # Clean the response
    response = response.strip().upper()
    
    # Look for date patterns in the response
    date_patterns = [
        r'(\d{4})-(\d{1,2})-(\d{1,2})',  # YYYY-MM-DD
        r'(\d{4})/(\d{1,2})/(\d{1,2})',  # YYYY/MM/DD  
        r'(\d{1,2})/(\d{1,2})/(\d{4})',  # MM/DD/YYYY
        r'(\d{1,2})-(\d{1,2})-(\d{4})',  # MM-DD-YYYY
        r'(\d{4})(\d{2})(\d{2})',        # YYYYMMDD
    ]
    
    for pattern in date_patterns:
        match = re.search(pattern, response)
        if match:
            groups = match.groups()
            try:
                if len(groups) == 3:
                    # Determine format and convert to YYYYMMDD
                    if len(groups[0]) == 4:  # First group is year
                        year, month, day = int(groups[0]), int(groups[1]), int(groups[2])
                    else:  # First group is month/day
                        if int(groups[2]) > 31:  # Last group is year
                            month, day, year = int(groups[0]), int(groups[1]), int(groups[2])
                        else:
                            day, month, year = int(groups[0]), int(groups[1]), int(groups[2])
                    
                    # Validate date
                    if 1900 <= year <= 2100 and 1 <= month <= 12 and 1 <= day <= 31:
                        return f"{year:04d}{month:02d}{day:02d}"
            except (ValueError, IndexError):
                continue
    
    return None

def parse_person_from_response(response: str) -> Optional[str]:
    """Parse person name from RAG response."""
    if not response or response.upper() in ['NO_PERSON', 'NONE', 'UNKNOWN', 'N/A']:
        return None
    
    # Clean and validate the response
    cleaned = re.sub(r'[^\w\s-]', '', response.strip())
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Filter out common non-name responses
    invalid_responses = [
        'i am sorry', 'sorry', 'the document', 'not found', 'not mentioned',
        'cannot find', 'no person', 'unknown', 'unclear', 'not specified',
        'the context', 'information', 'document date', 'no clear', 'main person'
    ]
    
    cleaned_lower = cleaned.lower()
    if any(invalid in cleaned_lower for invalid in invalid_responses):
        return None
    
    # Extract actual names (basic validation)
    if len(cleaned) >= 2 and len(cleaned) <= 50:
        # Remove common prefixes/suffixes that might appear
        words = cleaned.split()
        if len(words) >= 1:
            # Take first reasonable name-like part
            return ''.join(words[:2])  # Take first two words max, remove spaces
    
    return None

def parse_type_from_response(response: str) -> Optional[str]:
    """Parse document type from RAG response."""
    if not response or response.upper() in ['UNKNOWN', 'NONE', 'N/A']:
        return None
    
    # Clean the response
    cleaned = re.sub(r'[^\w\s]', ' ', response.strip())
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Common document types to look for
    document_types = {
        'contract': 'Contract',
        'agreement': 'Agreement', 
        'invoice': 'Invoice',
        'receipt': 'Receipt',
        'letter': 'Letter',
        'power of attorney': 'PowerOfAttorney',
        'poa': 'PowerOfAttorney',
        'claim': 'Claim',
        'approval': 'Approval',
        'certificate': 'Certificate',
        'license': 'License',
        'permit': 'Permit',
        'application': 'Application',
        'form': 'Form',
        'statement': 'Statement',
        'report': 'Report',
        'mortgage': 'Mortgage',
        'deed': 'Deed',
        'title': 'Title',
        'insurance': 'Insurance',
        'security': 'Security',
        'instrument': 'Instrument',
        'partial': 'PartialApproval'
    }
    
    cleaned_lower = cleaned.lower()
    
    # Look for document type matches
    for key, value in document_types.items():
        if key in cleaned_lower:
            return value
    
    # If no match, try to extract first meaningful word
    words = cleaned.split()
    if words:
        first_word = words[0].strip()
        if len(first_word) >= 3 and first_word.isalpha():
            return first_word.capitalize()
    
    return None

def create_filename_from_extracted_info(
    info: Dict[str, Optional[str]], 
    original_filename: str, 
    naming_option: str, 
    counter: Optional[int] = None,
    user_title: Optional[str] = None,
    user_client_name: Optional[str] = None
) -> str:
    """Create filename from extracted information with smart fallbacks."""
    file_ext = os.path.splitext(original_filename)[1].lower()
    
    # Apply fallbacks for missing information
    date_part = info.get('date') or datetime.now().strftime("%Y%m%d")
    person_part = info.get('person') or user_client_name or extract_name_from_filename(original_filename)
    type_part = info.get('type') or user_title or extract_type_from_filename(original_filename)
    
    # Clean components
    if person_part:
        person_part = clean_component_for_filename(person_part)
    if type_part:
        type_part = clean_component_for_filename(type_part)
    
    print(f"🔧 Building filename with fallbacks:")
    print(f"   - Date: {date_part} (extracted: {info.get('date')})")
    print(f"   - Person: {person_part} (extracted: {info.get('person')})")
    print(f"   - Type: {type_part} (extracted: {info.get('type')})")
    
    # Build filename based on naming option
    if naming_option == "add_timestamp":
        # Format: YYYYMMDD_PersonName_DocumentType.ext
        parts = [date_part]
        if person_part:
            parts.append(person_part)
        if type_part:
            parts.append(type_part)
        
        if len(parts) >= 2:  # At least date + one other component
            final_filename = f"{'_'.join(parts)}{file_ext}"
        else:
            print("⚠️ Insufficient components for intelligent naming, using original")
            return original_filename
            
    elif naming_option == "sequential_numbering":
        # Format: PersonName_DocumentType_001.ext
        seq_num = f"{counter:03d}" if counter else "001"
        parts = []
        if person_part:
            parts.append(person_part)
        if type_part:
            parts.append(type_part)
        parts.append(seq_num)
        
        if len(parts) >= 2:  # At least one component + seq_num
            final_filename = f"{'_'.join(parts)}{file_ext}"
        else:
            print("⚠️ Insufficient components for intelligent naming, using original")
            return original_filename
    else:
        final_filename = original_filename
    
    # Ensure filename isn't too long
    if len(final_filename) > 100:
        final_filename = final_filename[:97] + file_ext
    
    return final_filename

def clean_component_for_filename(component: str) -> str:
    """Clean a component to be filename-safe."""
    if not component:
        return ""
    
    # Remove special characters and clean
    cleaned = re.sub(r'[^\w\s-]', '', component)
    cleaned = re.sub(r'\s+', '', cleaned)  # Remove all spaces
    cleaned = cleaned.strip()
    
    # Limit length
    return cleaned[:20] if cleaned else ""

def extract_name_from_filename(filename: str) -> Optional[str]:
    """Try to extract a name from the original filename."""
    base_name = os.path.splitext(filename)[0]
    
    # Common patterns in filenames
    name_patterns = [
        r'([A-Z][a-z]+ [A-Z][a-z]+)',  # FirstName LastName
        r'([A-Z][a-z]+_[A-Z][a-z]+)',  # FirstName_LastName
        r'_([A-Z][a-z]+ [A-Z][a-z]+)',  # _FirstName LastName
    ]
    
    for pattern in name_patterns:
        match = re.search(pattern, base_name)
        if match:
            name = match.group(1).replace('_', ' ').replace(' ', '')
            if len(name) >= 4:  # Reasonable name length
                return name
    
    return None

def extract_type_from_filename(filename: str) -> Optional[str]:
    """Try to extract document type from the original filename."""
    base_name = os.path.splitext(filename)[0].lower()
    
    # Common document type patterns
    type_patterns = {
        'contract': 'Contract',
        'agreement': 'Agreement',
        'power': 'PowerOfAttorney',
        'attorney': 'PowerOfAttorney',
        'poa': 'PowerOfAttorney',
        'invoice': 'Invoice',
        'claim': 'Claim',
        'approval': 'Approval',
        'partial': 'PartialApproval',
        'security': 'Security',
        'instrument': 'Instrument',
        'mortgage': 'Mortgage',
        'deed': 'Deed'
    }
    
    for keyword, doc_type in type_patterns.items():
        if keyword in base_name:
            return doc_type
    
    return None

def generate_fallback_filename(
    original_filename: str,
    naming_option: str,
    user_title: Optional[str] = None,
    user_client_name: Optional[str] = None,
    counter: Optional[int] = None
) -> str:
    """Enhanced fallback filename generation."""
    file_ext = os.path.splitext(original_filename)[1].lower()
    
    def clean_for_filename(text: str) -> str:
        if not text:
            return ""
        cleaned = re.sub(r'[^\w\-_\.]', '_', text)
        cleaned = re.sub(r'_+', '_', cleaned)
        return cleaned.strip('_')[:30]
    
    # Try to use user settings if available
    if naming_option == "add_timestamp" and user_title and user_client_name:
        date_str = datetime.now().strftime("%Y%m%d")
        clean_title = clean_for_filename(user_title)
        clean_client = clean_for_filename(user_client_name)
        return f"{date_str}_{clean_client}_{clean_title}{file_ext}"
    
    elif naming_option == "sequential_numbering" and user_title and user_client_name:
        seq_num = f"{counter:03d}" if counter else "001"
        clean_title = clean_for_filename(user_title)
        clean_client = clean_for_filename(user_client_name)
        return f"{clean_client}_{clean_title}_{seq_num}{file_ext}"
    
    # Ultimate fallback: try to extract from filename, else use original
    elif naming_option in ["add_timestamp", "sequential_numbering"]:
        extracted_name = extract_name_from_filename(original_filename)
        extracted_type = extract_type_from_filename(original_filename)
        
        if extracted_name or extracted_type:
            if naming_option == "add_timestamp":
                date_str = datetime.now().strftime("%Y%m%d")
                parts = [date_str]
                if extracted_name:
                    parts.append(clean_for_filename(extracted_name))
                if extracted_type:
                    parts.append(clean_for_filename(extracted_type))
                return f"{'_'.join(parts)}{file_ext}"
            
            elif naming_option == "sequential_numbering":
                seq_num = f"{counter:03d}" if counter else "001"
                parts = []
                if extracted_name:
                    parts.append(clean_for_filename(extracted_name))
                if extracted_type:
                    parts.append(clean_for_filename(extracted_type))
                parts.append(seq_num)
                return f"{'_'.join(parts)}{file_ext}"
    
    print(f"⚠️ No valid naming configuration, keeping original: {original_filename}")
    return original_filename

# ================================
# BACKWARD COMPATIBILITY
# ================================

# Keep the old function name for backward compatibility
def generate_intelligent_filename_simple(
    rag_system: Dict[str, Any],
    original_filename: str,
    naming_option: str,
    user_title: Optional[str] = None,
    user_client_name: Optional[str] = None,
    counter: Optional[int] = None
) -> str:
    """
    Backward compatibility wrapper for the optimized function.
    This ensures existing code still works while using the new optimized single-query approach.
    """
    print("⚡ Using optimized single-query intelligent naming...")
    return generate_intelligent_filename_optimized(
        rag_system=rag_system,
        original_filename=original_filename,
        naming_option=naming_option,
        user_title=user_title,
        user_client_name=user_client_name,
        counter=counter
    )

def validate_pdf_content(pdf_path: str) -> dict:
    """
    Validate that PDF has extractable text content.
    Returns validation info.
    """
    try:
        with fitz.open(pdf_path) as doc:
            total_text = ""
            pages_with_text = 0

            for page in doc:
                page_text = page.get_text().strip()
                total_text += page_text
                if len(page_text) > 10:  # Page has meaningful text
                    pages_with_text += 1

            validation_info = {
                "is_valid": len(total_text.strip()) > 20,
                "total_pages": len(doc),
                "pages_with_text": pages_with_text,
                "total_characters": len(total_text),
                "avg_chars_per_page": len(total_text) / max(len(doc), 1),
                "text_coverage": pages_with_text / max(len(doc), 1)
            }

            print(f"📊 PDF validation:")
            print(f"   Valid: {validation_info['is_valid']}")
            print(f"   Pages: {validation_info['total_pages']}")
            print(f"   Pages with text: {validation_info['pages_with_text']}")
            print(f"   Total characters: {validation_info['total_characters']}")

            return validation_info

    except Exception as e:
        print(f"❌ PDF validation failed: {e}")
        return {
            "is_valid": False,
            "error": str(e)
        }

def extract_text_from_pdf(pdf_path: str) -> List[Document]:
    """
    Extract text from PDF using direct extraction (OCR functions removed).
    Returns a list of Document objects.
    """
    print("✅ Document Type: Well-Structured (Direct Text Extraction)")
    documents = []
    
    with fitz.open(pdf_path) as doc:
        for i, page in enumerate(doc):
            # Extract raw text from each page
            text = page.get_text()

            # Preserve critical newlines for logical chunking
            text = "\n".join([line.strip() for line in text.splitlines() if line.strip()])

            # Create Document object with metadata
            documents.append(Document(
                text=text,
                metadata={
                    "file_name": os.path.basename(pdf_path),
                    "page_number": i + 1,
                    "total_pages": len(doc)
                }
            ))

    return documents

# ================================
# RATE LIMITING PROTECTION
# ================================

def is_rate_limit_safe() -> bool:
    """
    Check if it's safe to make RAG queries based on rate limiting.
    Simple implementation - can be enhanced with actual rate tracking.
    """
    # This is a simple check - you can enhance with actual rate tracking
    # For now, always return True but log the optimization
    print("🛡️ Rate limit check: Using single optimized query")
    return True

# ================================
# PERFORMANCE MONITORING
# ================================

def log_naming_performance(operation: str, duration: float, queries_used: int = 1):
    """
    Log performance metrics for intelligent naming operations.
    """
    print(f"📊 Naming Performance:")
    print(f"   - Operation: {operation}")
    print(f"   - Duration: {duration:.2f}s")
    print(f"   - Queries used: {queries_used}")
    print(f"   - Rate limit friendly: {queries_used == 1}")
