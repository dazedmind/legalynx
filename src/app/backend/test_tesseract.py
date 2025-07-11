import pytesseract
from PIL import Image
import requests
from io import BytesIO

# Set tesseract path (update to your installation)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

try:
    # Test with a simple image
    print("Tesseract version:", pytesseract.get_tesseract_version())
    print("✅ Tesseract is working!")
except Exception as e:
    print("❌ Tesseract error:", e)
    print("Please check the tesseract_cmd path in the code above")