# 🤖 AI Service - المنصة الموحدة

خدمة الذكاء الاصطناعي للمنصة الموحدة باستخدام dLLM

## 🚀 التثبيت السريع

### المتطلبات
- Python 3.11+
- pip
- (اختياري) CUDA أو Apple Silicon GPU

### الخطوات

```bash
# 1. إنشاء بيئة افتراضية
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate  # Windows

# 2. تثبيت المتطلبات
pip install -r requirements.txt

# 3. (اختياري) تثبيت dLLM
pip install git+https://github.com/ZHZisZZ/dllm.git

# 4. إعداد المتغيرات
cp .env.example .env
# قم بتحرير .env وإضافة API keys إذا لزم الأمر

# 5. تشغيل الخدمة
python main.py
```

الخدمة ستعمل على: http://localhost:8000

## 📡 API Endpoints

### تصحيح OCR
```bash
POST /api/ai/correct-ocr
{
  "text": "النص المستخرج من OCR",
  "language": "ar"
}
```

### تصنيف الوثيقة
```bash
POST /api/ai/classify-document
{
  "text": "نص الوثيقة..."
}
```

### استخراج البيانات
```bash
POST /api/ai/extract-form-data
{
  "text": "نص النموذج",
  "form_type": "invoice"
}
```

### المحادثة
```bash
POST /api/ai/chat
{
  "message": "ما هو رصيد الصنف؟",
  "context": {}
}
```

## 🔧 التكوين

### استخدام Groq (موصى به - مجاني)
```bash
GROQ_API_KEY=gsk_your_key_here
```

### استخدام OpenAI
```bash
OPENAI_API_KEY=sk-your_key_here
```

### استخدام dLLM محلياً
```bash
# لا حاجة لـ API keys
# يتطلب تحميل النموذج محلياً
DLLM_MODEL=GSAI-ML/Tiny-A2D-Qwen-0.5B
USE_GPU=true
```

## 🐳 Docker

```bash
# Build
docker build -t unified-ai-service .

# Run
docker run -p 8000:8000 \
  -e GROQ_API_KEY=your_key \
  unified-ai-service
```

## 📊 مراقبة الصحة

```bash
curl http://localhost:8000/health
```

## 📝 الوثائق التفاعلية

بعد تشغيل الخدمة:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 الدعم

لأي مشاكل، راجع logs أو تواصل مع فريق التطوير.
