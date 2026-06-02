"""
Smart Resume Verifier — OCR Microservice
Extracts text from LeetCode profile screenshots using Tesseract OCR.

Requirements:
  pip install fastapi uvicorn pytesseract pillow python-multipart

System deps (Linux):
  sudo apt-get install tesseract-ocr

System deps (macOS):
  brew install tesseract

Run:
  python main.py
  # or
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import base64
import io
import os
import re
from typing import Optional
import ml_fraud_detection

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize ML model
ml_fraud_detection.init_model()

try:
    import pytesseract
    from PIL import Image, ImageEnhance, ImageFilter
    # Set tesseract path for Windows
    if os.name == 'nt':
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    print("WARNING: pytesseract or Pillow not installed. OCR will return empty text.")

app = FastAPI(title="Resume Verifier OCR Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class OCRRequest(BaseModel):
    image_base64: str
    enhance: bool = True

class OCRResponse(BaseModel):
    text: str
    success: bool
    char_count: int
    error: Optional[str] = None

def preprocess_image(img: "Image.Image") -> "Image.Image":
    """Enhance image quality for better OCR accuracy."""
    # Convert to RGB if needed
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    
    # Resize if too small
    w, h = img.size
    if w < 800:
        scale = 800 / w
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.5)
    
    # Enhance sharpness
    enhancer = ImageEnhance.Sharpness(img)
    img = enhancer.enhance(1.3)
    
    # Convert to grayscale for better OCR
    img = img.convert("L")
    
    # Apply slight sharpening filter
    img = img.filter(ImageFilter.SHARPEN)
    
    return img

def clean_text(text: str) -> str:
    """Clean OCR output."""
    # Normalize whitespace
    lines = [line.strip() for line in text.split('\n')]
    lines = [l for l in lines if l]
    return '\n'.join(lines)

def extract_leetcode_stats(text: str) -> dict:
    """Extract structured LeetCode data from OCR text."""
    result = {}
    
    # Total solved
    patterns = [
        r'(\d+)\s*(?:\/\s*\d+)?\s*(?:problems?\s*solved|solved)',
        r'solved[:\s]+(\d+)',
        r'(\d+)\s*Solved',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            result['total_solved'] = int(m.group(1))
            break
    
    # Difficulty breakdown
    for diff in ['Easy', 'Medium', 'Hard']:
        patterns = [
            rf'{diff}\s+(\d+)',
            rf'(\d+)\s+{diff}',
            rf'{diff}[:\s]+(\d+)',
        ]
        for p in patterns:
            m = re.search(p, text, re.IGNORECASE)
            if m:
                result[f'{diff.lower()}_solved'] = int(m.group(1))
                break
    
    # Acceptance rate
    m = re.search(r'(\d+\.?\d*)\s*%?\s*acceptance', text, re.IGNORECASE)
    if m:
        result['acceptance_rate'] = float(m.group(1))
    
    # Contest rating
    m = re.search(r'(?:contest\s+)?rating[:\s]+(\d+)', text, re.IGNORECASE)
    if m:
        result['contest_rating'] = int(m.group(1))
    
    # Global ranking
    m = re.search(r'(?:global\s+)?rank(?:ing)?[:\s#]+([0-9,]+)', text, re.IGNORECASE)
    if m:
        result['ranking'] = int(m.group(1).replace(',', ''))
    
    return result

@app.get("/health")
def health():
    return {
        "status": "ok",
        "tesseract_available": TESSERACT_AVAILABLE,
        "tesseract_version": str(pytesseract.get_tesseract_version()) if TESSERACT_AVAILABLE else None,
    }

@app.post("/ocr", response_model=OCRResponse)
def perform_ocr(request: OCRRequest):
    if not TESSERACT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="Tesseract not available. Install: pip install pytesseract pillow && sudo apt-get install tesseract-ocr"
        )
    
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.image_base64)
        img = Image.open(io.BytesIO(image_data))
        
        # Preprocess
        if request.enhance:
            img = preprocess_image(img)
        
        # OCR config for better accuracy on UI screenshots
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz%/.,()\n '
        
        text = pytesseract.image_to_string(img, config=custom_config)
        text = clean_text(text)
        
        return OCRResponse(
            text=text,
            success=True,
            char_count=len(text)
        )
    except Exception as e:
        return OCRResponse(
            text="",
            success=False,
            char_count=0,
            error=str(e)
        )

@app.post("/ocr/structured")
def ocr_structured(request: OCRRequest):
    """OCR + structured LeetCode data extraction."""
    ocr_result = perform_ocr(request)
    stats = extract_leetcode_stats(ocr_result.text) if ocr_result.success else {}
    return {
        "text": ocr_result.text,
        "stats": stats,
        "success": ocr_result.success,
    }

class FraudRequest(BaseModel):
    test_score: float
    github_score: float
    skill_score: float
    claimed_skills_text: str

@app.post("/ai/fraud-predict")
def predict_fraud_endpoint(request: FraudRequest):
    # Pass to the python scikit-learn model
    result = ml_fraud_detection.predict_fraud(
        request.test_score,
        request.github_score,
        request.skill_score,
        request.claimed_skills_text
    )
    # Check if result is float (old behaviour) or dict
    if isinstance(result, float):
        prob = result
        reasons = []
    else:
        prob = result.get("probability", 0.5)
        reasons = result.get("reasons", [])

    return {
        "fraud_probability": prob,
        "fraud_reasons": reasons,
        "model_used": "RandomForestClassifier(n_estimators=50)",
        "success": True
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
