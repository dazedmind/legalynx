import os
import io
import fitz
import cv2
import pytesseract
import numpy as np
from PIL import Image
from typing import List, Tuple
from llama_index.core import Document
from llama_index.core.schema import TextNode

# Configure Tesseract path for Windows (update this path to match your installation)
# Comment out or modify this line if tesseract is already in your PATH
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Import OCR config - using absolute import
try:
    from rag_pipeline.config import OCR_CONFIG
except ImportError:
    # Fallback OCR config if import fails
    OCR_CONFIG = {
        "text_threshold": 100,
        "confidence_threshold": 30,
        "scale_percent": 200,
        "tesseract_config": r'--oem 3 -l eng'
    }


def pdf_to_images(pdf_path: str) -> List[np.ndarray]:
    """
    Convert each page of a PDF file into high-resolution images for OCR.
    Returns a list of images, one per page.
    """
    images = []
    doc = fitz.open(pdf_path)
    try:
        for page_num in range(doc.page_count):
            page = doc[page_num]
            
            # Use higher resolution for better OCR
            mat = fitz.Matrix(2.0, 2.0)  # 2x zoom for better quality
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image then to numpy array
            img_data = pix.tobytes("ppm")
            img = Image.open(io.BytesIO(img_data))
            img_array = np.array(img)
            images.append(img_array)
    finally:
        doc.close()
    
    return images


def preprocess_image(img: np.ndarray, show_preview: bool = False) -> np.ndarray:
    """
    Preprocess an image for OCR by enhancing contrast and sharpening.
    Uses CLAHE for local contrast normalization and Laplacian filtering for edge enhancement.
    """
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    # Apply CLAHE to enhance local contrast
    clahe = cv2.createCLAHE(clipLimit=1.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    # Apply a mild sharpening filter to enhance edges
    sharpening_kernel = np.array([
        [0, -1, 0],
        [-1, 4.5, -1],
        [0, -1, 0]
    ])
    gray = cv2.filter2D(gray, -1, sharpening_kernel)

    # Resize for better OCR accuracy (Tesseract works better on larger text)
    scale_percent = OCR_CONFIG["scale_percent"]
    width = int(gray.shape[1] * scale_percent / 100)
    height = int(gray.shape[0] * scale_percent / 100)
    gray = cv2.resize(gray, (width, height), interpolation=cv2.INTER_CUBIC)

    # Optionally display the preprocessed image
    if show_preview:
        try:
            from IPython.display import display
            display(Image.fromarray(gray))
        except ImportError:
            pass  # Skip if not in Jupyter environment

    return gray


def perform_ocr(images: List[np.ndarray]) -> Tuple[List[str], List[dict]]:
    """
    Extracts text and bounding box data from a list of preprocessed images.
    Returns extracted text and structured OCR data.
    """
    all_text = []
    all_ocr_data = []
    custom_config = OCR_CONFIG["tesseract_config"]

    for gray in images:
        # Extract plain text
        ocr_text = pytesseract.image_to_string(gray, config=custom_config)
        all_text.append(ocr_text)

        # Extract detailed OCR data (bounding boxes, confidence)
        ocr_data = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
        all_ocr_data.append(ocr_data)

    return all_text, all_ocr_data


def visualize_bounding_boxes(original_image: np.ndarray, processed_image: np.ndarray, 
                           ocr_data: dict, confidence_threshold: int = None) -> None:
    """
    Draws bounding boxes on the preprocessed image for verification.
    Only boxes with confidence above the threshold are displayed.
    """
    import matplotlib.pyplot as plt
    
    if confidence_threshold is None:
        confidence_threshold = OCR_CONFIG["confidence_threshold"]
    
    # Use a color version of the processed image for drawing
    image_copy = cv2.cvtColor(processed_image, cv2.COLOR_GRAY2BGR)

    for i in range(len(ocr_data['text'])):
        # Extract bounding box and confidence information
        x, y, w, h = ocr_data['left'][i], ocr_data['top'][i], ocr_data['width'][i], ocr_data['height'][i]
        conf = int(ocr_data['conf'][i])

        # Draw only high-confidence boxes
        if conf > confidence_threshold:
            image_copy = cv2.rectangle(image_copy, (x, y), (x + w, y + h), (0, 255, 0), 2)
            text = ocr_data['text'][i].strip()
            if text:
                # Overlay the recognized text near the bounding box
                cv2.putText(image_copy, text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1, cv2.LINE_AA)

    # Display the image with bounding boxes
    plt.figure(figsize=(15, 20))
    plt.imshow(cv2.cvtColor(image_copy, cv2.COLOR_BGR2RGB))
    plt.axis('off')
    plt.show()


def is_scanned_pdf(pdf_path: str, text_threshold: int = None) -> bool:
    """
    Detects if a PDF is scanned or well-structured.
    Returns True if the PDF is likely scanned (low text content), False otherwise.
    """
    if text_threshold is None:
        text_threshold = OCR_CONFIG["text_threshold"]
    
    with fitz.open(pdf_path) as doc:
        total_text = "".join([page.get_text() for page in doc])

    # Consider it scanned if the total extracted text is below the threshold
    return len(total_text.strip()) < text_threshold


def extract_text_from_pdf(pdf_path: str) -> List[Document]:
    """
    Extract text from PDF using appropriate method (OCR for scanned, direct extraction for structured).
    Returns a list of Document objects.
    """
    # Check if the document is scanned
    is_scanned = is_scanned_pdf(pdf_path)

    if is_scanned:
        print("📝 Document Type: Scanned (OCR Required)")
        images = pdf_to_images(pdf_path)
        preprocessed_images = [preprocess_image(img) for img in images]
        ocr_texts, ocr_datasets = perform_ocr(preprocessed_images)
        documents = [Document(text=text) for text in ocr_texts]
    else:
        print("✅ Document Type: Well-Structured (No OCR Needed)")
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


def save_uploaded_file(file_content: bytes, filename: str, upload_dir: str = "sample_docs") -> str:
    """
    Save uploaded file content to disk and return the file path.
    """
    # Create directory if it doesn't exist
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save the file
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, 'wb') as f:
        f.write(file_content)
    
    print(f"File saved to {file_path}")
    return file_path