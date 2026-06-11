#!/usr/bin/env python3
"""
🤖 خدمات الذكاء الاصطناعي للمنصة الموحدة
AI Services for Unified Platform (Warehouse + Document Archive)

Features:
- OCR Text Correction using dLLM
- Document Classification
- Form Data Extraction
- Warehouse Assistant Chatbot
- Arabic Language Support (RTL)

Author: MMIT - Unified Platform
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =============================================================================
# Configuration
# =============================================================================

class Settings:
    """Application settings"""

    # Model settings
    MODEL_NAME: str = os.getenv("DLLM_MODEL", "GSAI-ML/Tiny-A2D-Qwen-0.5B")
    USE_GPU: bool = os.getenv("USE_GPU", "true").lower() == "true"

    # API settings
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Document types for classification
    DOCUMENT_TYPES: List[str] = [
        "فاتورة",
        "عقد",
        "مذكرة داخلية",
        "محضر اجتماع",
        "طلب صرف",
        "أمر توريد",
        "مستند استلام",
        "محضر جرد",
        "تسوية جردية",
        "عهدة موظف",
        "إذن صرف",
        "أخرى"
    ]

    # Warehouse form types
    FORM_TYPES: Dict[str, List[str]] = {
        "exchange_request": ["رقم الطلب", "التاريخ", "الجهة الطالبة", "الأصناف", "الكميات"],
        "invoice": ["رقم الفاتورة", "المورد", "التاريخ", "الأصناف", "الكميات", "الأسعار", "الإجمالي"],
        "receipt": ["رقم المستند", "المستلم", "التاريخ", "الأصناف", "الحالة"],
        "inventory": ["المستودع", "تاريخ الجرد", "اللجنة", "الأصناف", "الرصيد الدفتري", "الرصيد الفعلي"],
        "custody": ["الموظف", "الرقم الوظيفي", "الصنف", "الكمية", "تاريخ الاستلام", "نوع الأصل"]
    }

settings = Settings()

# =============================================================================
# dLLM Model Manager
# =============================================================================

class DLLMModelManager:
    """Manages dLLM model loading and inference"""

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.sampler = None
        self.is_loaded = False
        self.use_fallback = False

    async def load_model(self):
        """Load the dLLM model"""
        try:
            logger.info(f"Loading dLLM model: {settings.MODEL_NAME}")

            # Try to import dLLM
            try:
                import dllm

                # Load model and tokenizer
                self.model = dllm.utils.get_model(
                    model_name_or_path=settings.MODEL_NAME
                )
                self.tokenizer = dllm.utils.get_tokenizer(
                    model_name_or_path=settings.MODEL_NAME
                )

                # Create sampler
                self.sampler = dllm.core.samplers.MDLMSampler(
                    model=self.model,
                    tokenizer=self.tokenizer
                )

                # Move to GPU if available
                if settings.USE_GPU:
                    import torch
                    if torch.cuda.is_available():
                        self.model = self.model.cuda()
                        logger.info("Model loaded on CUDA GPU")
                    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
                        self.model = self.model.to('mps')
                        logger.info("Model loaded on Apple MPS (M4)")
                    else:
                        logger.info("Model loaded on CPU")

                self.is_loaded = True
                logger.info("dLLM model loaded successfully!")

            except ImportError:
                logger.warning("dLLM not installed, using fallback mode")
                self.use_fallback = True
                await self._load_fallback_model()

        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.use_fallback = True
            await self._load_fallback_model()

    async def _load_fallback_model(self):
        """Load fallback model (OpenAI or Groq)"""
        try:
            # Try Groq first (faster and free)
            if os.getenv("GROQ_API_KEY"):
                from groq import Groq
                self.fallback_client = Groq()
                self.fallback_model = "llama-3.1-8b-instant"
                logger.info("Using Groq as fallback")
            elif os.getenv("OPENAI_API_KEY"):
                from openai import OpenAI
                self.fallback_client = OpenAI()
                self.fallback_model = "gpt-4o-mini"
                logger.info("Using OpenAI as fallback")
            else:
                logger.warning("No API keys found, using mock responses")
                self.fallback_client = None

            self.is_loaded = True

        except Exception as e:
            logger.error(f"Fallback model error: {e}")
            self.fallback_client = None
            self.is_loaded = True

    async def generate(
        self,
        prompt: str,
        max_tokens: int = 500,
        temperature: float = 0.3,
        system_prompt: Optional[str] = None
    ) -> str:
        """Generate text using dLLM or fallback"""

        if not self.is_loaded:
            await self.load_model()

        try:
            if not self.use_fallback and self.sampler:
                # Use dLLM
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                response = self.sampler.generate(
                    messages=messages,
                    max_new_tokens=max_tokens,
                    temperature=temperature
                )
                return response

            elif self.fallback_client:
                # Use fallback (Groq/OpenAI)
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": prompt})

                response = self.fallback_client.chat.completions.create(
                    model=self.fallback_model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature
                )
                return response.choices[0].message.content

            else:
                # Mock response for demo
                return self._mock_response(prompt)

        except Exception as e:
            logger.error(f"Generation error: {e}")
            return self._mock_response(prompt)

    def _mock_response(self, prompt: str) -> str:
        """Generate mock response for demo mode"""
        if "صحح" in prompt or "correct" in prompt.lower():
            return "[تم التصحيح - وضع العرض التجريبي]"
        elif "صنف" in prompt or "classify" in prompt.lower():
            return "مذكرة داخلية"
        elif "استخرج" in prompt or "extract" in prompt.lower():
            return '{"extracted": "demo_data"}'
        else:
            return "هذا رد تجريبي. يرجى تثبيت dLLM أو إعداد API keys."

# Global model manager
model_manager = DLLMModelManager()

# =============================================================================
# Pydantic Models
# =============================================================================

class OCRCorrectionRequest(BaseModel):
    """طلب تصحيح OCR"""
    text: str = Field(..., description="النص المستخرج من OCR")
    language: str = Field(default="ar", description="لغة النص")
    context: Optional[str] = Field(default=None, description="سياق إضافي")

class OCRCorrectionResponse(BaseModel):
    """رد تصحيح OCR"""
    original: str
    corrected: str
    confidence: float
    corrections_made: int

class DocumentClassifyRequest(BaseModel):
    """طلب تصنيف الوثيقة"""
    text: str = Field(..., description="نص الوثيقة")
    max_length: int = Field(default=1000, description="الحد الأقصى للنص")

class DocumentClassifyResponse(BaseModel):
    """رد تصنيف الوثيقة"""
    classification: str
    confidence: float
    all_scores: Dict[str, float]

class FormExtractionRequest(BaseModel):
    """طلب استخراج بيانات النموذج"""
    text: str = Field(..., description="نص النموذج")
    form_type: str = Field(..., description="نوع النموذج")
    fields: Optional[List[str]] = Field(default=None, description="الحقول المطلوبة")

class FormExtractionResponse(BaseModel):
    """رد استخراج البيانات"""
    form_type: str
    extracted_data: Dict[str, Any]
    confidence: float
    missing_fields: List[str]

class ChatRequest(BaseModel):
    """طلب المحادثة"""
    message: str = Field(..., description="رسالة المستخدم")
    context: Optional[Dict[str, Any]] = Field(default=None, description="سياق النظام")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default=None)

class ChatResponse(BaseModel):
    """رد المحادثة"""
    response: str
    suggested_actions: Optional[List[str]] = None

class HealthResponse(BaseModel):
    """رد فحص الصحة"""
    status: str
    model_loaded: bool
    model_name: str
    using_fallback: bool
    timestamp: str

# =============================================================================
# AI Services
# =============================================================================

class OCRCorrectionService:
    """خدمة تصحيح OCR"""

    async def correct(self, request: OCRCorrectionRequest) -> OCRCorrectionResponse:
        """تصحيح نص OCR باستخدام dLLM"""

        system_prompt = """
        أنت مصحح نصوص متخصص في تصحيح أخطاء OCR للوثائق العربية الرسمية.
        قم بتصحيح الأخطاء الإملائية والنحوية مع الحفاظ على المعنى الأصلي.
        لا تضف أو تحذف معلومات، فقط صحح الأخطاء.
        """

        prompt = f"""
        صحح الأخطاء في النص التالي المستخرج من الماسح الضوئي:

        النص الأصلي:
        {request.text}

        النص المصحح:
        """

        corrected = await model_manager.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            temperature=0.2
        )

        # Count corrections
        corrections = self._count_corrections(request.text, corrected)

        return OCRCorrectionResponse(
            original=request.text,
            corrected=corrected.strip(),
            confidence=0.85 if not model_manager.use_fallback else 0.70,
            corrections_made=corrections
        )

    def _count_corrections(self, original: str, corrected: str) -> int:
        """حساب عدد التصحيحات"""
        # Simple word-level comparison
        orig_words = set(original.split())
        corr_words = set(corrected.split())
        return len(orig_words.symmetric_difference(corr_words))


class DocumentClassificationService:
    """خدمة تصنيف الوثائق"""

    async def classify(self, request: DocumentClassifyRequest) -> DocumentClassifyResponse:
        """تصنيف الوثيقة"""

        system_prompt = """
        أنت مصنف وثائق متخصص في الوثائق الحكومية والإدارية.
        صنف الوثيقة إلى أحد الأنواع التالية فقط:
        """ + ", ".join(settings.DOCUMENT_TYPES)

        prompt = f"""
        صنف الوثيقة التالية:

        {request.text[:request.max_length]}

        أجب بنوع الوثيقة فقط من القائمة المحددة.
        النوع:
        """

        result = await model_manager.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=50,
            temperature=0.1
        )

        # Parse classification
        classification = self._parse_classification(result.strip())

        # Generate confidence scores (simplified)
        scores = {doc_type: 0.1 for doc_type in settings.DOCUMENT_TYPES}
        scores[classification] = 0.85

        return DocumentClassifyResponse(
            classification=classification,
            confidence=0.85,
            all_scores=scores
        )

    def _parse_classification(self, result: str) -> str:
        """تحليل نتيجة التصنيف"""
        result_lower = result.strip()

        for doc_type in settings.DOCUMENT_TYPES:
            if doc_type in result_lower:
                return doc_type

        return "أخرى"


class FormExtractionService:
    """خدمة استخراج بيانات النماذج"""

    async def extract(self, request: FormExtractionRequest) -> FormExtractionResponse:
        """استخراج بيانات النموذج"""

        # Get expected fields for form type
        expected_fields = request.fields or settings.FORM_TYPES.get(
            request.form_type,
            ["البيانات العامة"]
        )

        system_prompt = f"""
        أنت محلل وثائق متخصص في استخراج البيانات من نماذج {request.form_type}.
        استخرج البيانات التالية: {', '.join(expected_fields)}
        أجب بصيغة JSON فقط.
        """

        json_template = {field: "[استخرج]" for field in expected_fields}

        prompt = f"""
        استخرج البيانات من النموذج التالي:

        {request.text}

        أعد البيانات بصيغة JSON:
        {json.dumps(json_template, ensure_ascii=False, indent=2)}

        JSON:
        """

        result = await model_manager.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=800,
            temperature=0.2
        )

        # Parse JSON result
        extracted_data, missing = self._parse_json_result(result, expected_fields)

        return FormExtractionResponse(
            form_type=request.form_type,
            extracted_data=extracted_data,
            confidence=0.80 if len(missing) == 0 else 0.60,
            missing_fields=missing
        )

    def _parse_json_result(
        self,
        result: str,
        expected_fields: List[str]
    ) -> tuple[Dict[str, Any], List[str]]:
        """تحليل نتيجة JSON"""
        try:
            # Try to extract JSON from response
            import re
            json_match = re.search(r'\{[^{}]*\}', result, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group())
            else:
                data = json.loads(result)

            # Find missing fields
            missing = [f for f in expected_fields if f not in data or not data[f]]

            return data, missing

        except json.JSONDecodeError:
            return {"raw_text": result}, expected_fields


class WarehouseAssistantService:
    """خدمة المساعد الذكي للمستودعات"""

    SYSTEM_PROMPT = """
    أنت مساعد ذكي لنظام إدارة المستودعات الحكومية.

    يمكنك المساعدة في:
    - الاستعلام عن أرصدة الأصناف
    - متابعة طلبات الصرف
    - معرفة حالة العهد
    - تتبع عمليات الجرد
    - شرح الإجراءات والسياسات

    استخدم اللغة العربية الفصحى الرسمية.
    كن موجزاً ودقيقاً في إجاباتك.
    إذا لم تكن متأكداً، اطلب توضيحاً.
    """

    async def chat(self, request: ChatRequest) -> ChatResponse:
        """معالجة رسالة المستخدم"""

        # Build context-aware prompt
        context_str = ""
        if request.context:
            context_str = f"\n\nمعلومات النظام الحالية:\n{json.dumps(request.context, ensure_ascii=False, indent=2)}"

        # Build conversation history
        history_str = ""
        if request.conversation_history:
            for msg in request.conversation_history[-5:]:  # Last 5 messages
                role = "المستخدم" if msg["role"] == "user" else "المساعد"
                history_str += f"\n{role}: {msg['content']}"

        prompt = f"""
        {context_str}

        المحادثة السابقة:{history_str}

        المستخدم: {request.message}

        المساعد:
        """

        response = await model_manager.generate(
            prompt=prompt,
            system_prompt=self.SYSTEM_PROMPT,
            max_tokens=500,
            temperature=0.4
        )

        # Extract suggested actions
        actions = self._extract_actions(request.message, response)

        return ChatResponse(
            response=response.strip(),
            suggested_actions=actions
        )

    def _extract_actions(self, query: str, response: str) -> List[str]:
        """استخراج الإجراءات المقترحة"""
        actions = []

        keywords_actions = {
            "رصيد": ["عرض تقرير الأرصدة", "تصدير إلى Excel"],
            "صرف": ["إنشاء طلب صرف جديد", "عرض الطلبات المعلقة"],
            "جرد": ["بدء جرد جديد", "عرض نتائج الجرد"],
            "عهدة": ["عرض عهد الموظفين", "إنشاء إذن عهدة"],
            "تقرير": ["تقرير شامل", "تقرير مخصص"],
        }

        for keyword, acts in keywords_actions.items():
            if keyword in query or keyword in response:
                actions.extend(acts)

        return list(set(actions))[:3]  # Max 3 actions


# =============================================================================
# FastAPI Application
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("Starting AI Services...")
    await model_manager.load_model()
    yield
    # Shutdown
    logger.info("Shutting down AI Services...")

app = FastAPI(
    title="خدمات الذكاء الاصطناعي - المنصة الموحدة",
    description="AI Services for Unified Government Platform (Warehouse + Archive)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ocr_service = OCRCorrectionService()
classification_service = DocumentClassificationService()
extraction_service = FormExtractionService()
assistant_service = WarehouseAssistantService()

# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/", tags=["Root"])
async def root():
    """الصفحة الرئيسية"""
    return {
        "service": "AI Services - Unified Platform",
        "version": "1.0.0",
        "endpoints": {
            "ocr": "/api/ai/correct-ocr",
            "classify": "/api/ai/classify-document",
            "extract": "/api/ai/extract-form-data",
            "chat": "/api/ai/chat",
            "health": "/health"
        }
    }

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """فحص صحة الخدمة"""
    return HealthResponse(
        status="healthy" if model_manager.is_loaded else "loading",
        model_loaded=model_manager.is_loaded,
        model_name=settings.MODEL_NAME,
        using_fallback=model_manager.use_fallback,
        timestamp=datetime.now().isoformat()
    )

@app.post("/api/ai/correct-ocr", response_model=OCRCorrectionResponse, tags=["OCR"])
async def correct_ocr(request: OCRCorrectionRequest):
    """
    تصحيح نص OCR

    يستخدم dLLM لتصحيح الأخطاء الناتجة عن المسح الضوئي
    """
    try:
        return await ocr_service.correct(request)
    except Exception as e:
        logger.error(f"OCR correction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/classify-document", response_model=DocumentClassifyResponse, tags=["Classification"])
async def classify_document(request: DocumentClassifyRequest):
    """
    تصنيف الوثيقة

    يصنف الوثيقة إلى أحد الأنواع المحددة (فاتورة، عقد، مذكرة، إلخ)
    """
    try:
        return await classification_service.classify(request)
    except Exception as e:
        logger.error(f"Classification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/extract-form-data", response_model=FormExtractionResponse, tags=["Extraction"])
async def extract_form_data(request: FormExtractionRequest):
    """
    استخراج بيانات النموذج

    يستخرج البيانات المهيكلة من النماذج (فواتير، طلبات صرف، إلخ)
    """
    try:
        return await extraction_service.extract(request)
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ai/chat", response_model=ChatResponse, tags=["Assistant"])
async def chat(request: ChatRequest):
    """
    المساعد الذكي للمستودعات

    يجيب على استفسارات المستخدمين حول النظام
    """
    try:
        return await assistant_service.chat(request)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/ai/document-types", tags=["Config"])
async def get_document_types():
    """الحصول على أنواع الوثائق المدعومة"""
    return {"document_types": settings.DOCUMENT_TYPES}

@app.get("/api/ai/form-types", tags=["Config"])
async def get_form_types():
    """الحصول على أنواع النماذج وحقولها"""
    return {"form_types": settings.FORM_TYPES}

# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    )
