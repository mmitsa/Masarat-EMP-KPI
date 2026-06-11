// =============================================================================
// مكون تصحيح OCR بالذكاء الاصطناعي - Tailwind Version
// OCR Correction Component with AI Enhancement
// =============================================================================

import { useState, useCallback } from 'react';
import { Button, Badge } from '../ui';
import api from '../../lib/api';

export default function OCRCorrection({
  initialText = '',
  onCorrectionApplied,
  showComparison = true,
}) {
  // State
  const [originalText, setOriginalText] = useState(initialText);
  const [correctedText, setCorrectedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // ==========================================================================
  // API Call
  // ==========================================================================

  const correctText = async () => {
    if (!originalText.trim()) {
      setError('يرجى إدخال نص للتصحيح');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.ai.correctOCR(originalText);

      setCorrectedText(data.corrected);
      setResult({
        confidence: data.confidence,
        corrections: data.correctionsMade || data.corrections_made
      });
    } catch (err) {
      console.error('OCR correction error:', err);
      setError('حدث خطأ في تصحيح النص. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleApply = () => {
    if (onCorrectionApplied) {
      onCorrectionApplied(correctedText);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleReset = () => {
    setCorrectedText('');
    setResult(null);
    setError(null);
  };

  const handleDownload = () => {
    const blob = new Blob([correctedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'corrected_text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm dark:shadow-gray-900/20 border border-gray-100 dark:border-gray-800" dir="rtl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              تصحيح النص بالذكاء الاصطناعي
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              يستخدم نموذج dLLM لتصحيح أخطاء المسح الضوئي
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            <button
              onClick={() => setError(null)}
              className="mr-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Text */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
              النص الأصلي (من OCR)
            </span>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 p-4
                         text-right font-arabic resize-none
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-all duration-200 disabled:bg-gray-50"
              rows={10}
              placeholder="الصق هنا النص المستخرج من الماسح الضوئي..."
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {originalText.length} حرف
              </span>
              <button
                className="text-xs text-primary-600 hover:text-primary-700"
                onClick={() => handleCopy(originalText)}
                disabled={!originalText}
              >
                نسخ
              </button>
            </div>
          </label>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={correctText}
            loading={isLoading}
            disabled={!originalText.trim() || isLoading}
          >
            {isLoading ? 'جاري التصحيح...' : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                تصحيح بالذكاء الاصطناعي
              </span>
            )}
          </Button>
        </div>

        {/* Corrected Text */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              النص المصحح
            </span>
            {result && (
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs text-white ${getConfidenceColor(result.confidence)}`}>
                  الثقة: {Math.round(result.confidence * 100)}%
                </div>
                <Badge variant="info" size="sm">
                  {result.corrections} تصحيح
                </Badge>
              </div>
            )}
          </div>

          {isEditing ? (
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 p-4
                         text-right font-arabic resize-none
                         focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-all duration-200"
              rows={10}
              value={correctedText}
              onChange={(e) => setCorrectedText(e.target.value)}
            />
          ) : (
            <div
              className={`
                min-h-[240px] rounded-lg border p-4
                ${correctedText ? 'bg-green-50 border-green-200' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
                text-right font-arabic whitespace-pre-wrap
              `}
            >
              {correctedText || (
                <span className="text-gray-400 italic">
                  سيظهر النص المصحح هنا...
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {correctedText.length} حرف
            </span>
            <div className="flex gap-2">
              <button
                className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
                onClick={() => setIsEditing(!isEditing)}
                disabled={!correctedText}
              >
                {isEditing ? 'عرض' : 'تحرير'}
              </button>
              <button
                className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
                onClick={() => handleCopy(correctedText)}
                disabled={!correctedText}
              >
                نسخ
              </button>
              <button
                className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
                onClick={handleDownload}
                disabled={!correctedText}
              >
                تنزيل
              </button>
            </div>
          </div>

          {correctedText && (
            <div className="flex gap-3 pt-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                إعادة
              </Button>
              <Button
                variant="success"
                className="flex-1"
                onClick={handleApply}
              >
                تطبيق التصحيح
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Progress */}
      {isLoading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            جاري تحليل النص وتصحيح الأخطاء بواسطة dLLM...
          </p>
        </div>
      )}

      {/* Stats */}
      {result && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {Math.round(result.confidence * 100)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">معدل الثقة</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {result.corrections}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">تصحيحات</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {correctedText.length - originalText.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">أحرف مضافة</div>
            </div>
          </div>
        </div>
      )}

      {/* Powered by */}
      <div className="mt-4 text-center">
        <span className="text-xs text-gray-400">
          مدعوم بـ dLLM • الذكاء الاصطناعي
        </span>
      </div>
    </div>
  );
}
