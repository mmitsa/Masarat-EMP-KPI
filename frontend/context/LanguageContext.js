/**
 * Language Context - سياق اللغة
 * يدير اللغة الحالية والتبديل بين اللغات
 * يدعم الكشف التلقائي عن اللغة بناءً على IP والمتصفح وتفضيلات المستخدم
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

// اللغات المدعومة
export const SUPPORTED_LANGUAGES = {
    ar: {
        code: 'ar',
        name: 'العربية',
        nativeName: 'العربية',
        dir: 'rtl',
        font: 'Cairo',
        flag: '🇸🇦',
        dateLocale: 'ar-SA',
    },
    en: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        dir: 'ltr',
        font: 'Inter',
        flag: '🇬🇧',
        dateLocale: 'en-US',
    },
};

// خريطة الدول إلى اللغات
const COUNTRY_LANGUAGE_MAP = {
    // دول عربية
    'SA': 'ar', // السعودية
    'AE': 'ar', // الإمارات
    'KW': 'ar', // الكويت
    'BH': 'ar', // البحرين
    'QA': 'ar', // قطر
    'OM': 'ar', // عمان
    'EG': 'ar', // مصر
    'JO': 'ar', // الأردن
    'LB': 'ar', // لبنان
    'SY': 'ar', // سوريا
    'IQ': 'ar', // العراق
    'YE': 'ar', // اليمن
    'LY': 'ar', // ليبيا
    'TN': 'ar', // تونس
    'DZ': 'ar', // الجزائر
    'MA': 'ar', // المغرب
    'SD': 'ar', // السودان
    // دول إنجليزية
    'US': 'en',
    'GB': 'en',
    'AU': 'en',
    'CA': 'en',
    'IN': 'en',
    'PK': 'en', // باكستان - إنجليزي كافتراضي
    'PH': 'en', // الفلبين
    'BD': 'en', // بنغلاديش
    // افتراضي
    'default': 'ar',
};

// مفتاح التخزين المحلي
const STORAGE_KEY = 'masarat-language';
const COOKIE_NAME = 'NEXT_LOCALE';

// السياق
const LanguageContext = createContext({
    language: 'ar',
    languageInfo: SUPPORTED_LANGUAGES.ar,
    isRTL: true,
    changeLanguage: () => {},
    t: (key) => key,
    detectLanguage: () => {},
    isLoading: false,
});

/**
 * مزود سياق اللغة
 */
export function LanguageProvider({ children }) {
    const router = useRouter();
    const [language, setLanguage] = useState('ar');
    const [isLoading, setIsLoading] = useState(true);
    const [translations, setTranslations] = useState({});

    // معلومات اللغة الحالية
    const languageInfo = SUPPORTED_LANGUAGES[language] || SUPPORTED_LANGUAGES.ar;
    const isRTL = languageInfo.dir === 'rtl';

    /**
     * تحميل ملفات الترجمة
     */
    const loadTranslations = useCallback(async (lang) => {
        try {
            const [common, hr, warehouse, settings, auth] = await Promise.all([
                fetch(`/locales/${lang}/common.json`).then(r => r.ok ? r.json() : {}),
                fetch(`/locales/${lang}/hr.json`).then(r => r.ok ? r.json() : {}),
                fetch(`/locales/${lang}/warehouse.json`).then(r => r.ok ? r.json() : {}),
                fetch(`/locales/${lang}/settings.json`).then(r => r.ok ? r.json() : {}),
                fetch(`/locales/${lang}/auth.json`).then(r => r.ok ? r.json() : {}),
            ]);

            setTranslations({
                common,
                hr,
                warehouse,
                settings,
                auth,
            });
        } catch (error) {
            console.warn('Error loading translations:', error);
        }
    }, []);

    /**
     * الكشف التلقائي عن اللغة
     */
    const detectLanguage = useCallback(async () => {
        // 1. أولاً: تفضيل المستخدم المحفوظ
        const savedLang = localStorage.getItem(STORAGE_KEY);
        if (savedLang && SUPPORTED_LANGUAGES[savedLang]) {
            return savedLang;
        }

        // 2. ثانياً: من الكوكي
        const cookieLang = getCookie(COOKIE_NAME);
        if (cookieLang && SUPPORTED_LANGUAGES[cookieLang]) {
            return cookieLang;
        }

        // 3. ثالثاً: من المتصفح
        if (typeof navigator !== 'undefined') {
            const browserLang = navigator.language?.split('-')[0];
            if (browserLang && SUPPORTED_LANGUAGES[browserLang]) {
                return browserLang;
            }
        }

        // 4. افتراضي: العربية
        return 'ar';
    }, []);

    /**
     * تغيير اللغة
     */
    const changeLanguage = useCallback(async (newLang) => {
        if (!SUPPORTED_LANGUAGES[newLang]) {
            console.warn('Unsupported language:', newLang);
            return;
        }

        setIsLoading(true);

        // حفظ في localStorage
        localStorage.setItem(STORAGE_KEY, newLang);

        // حفظ في Cookie (للـ SSR)
        setCookie(COOKIE_NAME, newLang, 365);

        // تحديث الـ State
        setLanguage(newLang);

        // تحميل الترجمات
        await loadTranslations(newLang);

        // تحديث اتجاه الصفحة
        const langInfo = SUPPORTED_LANGUAGES[newLang];
        document.documentElement.lang = newLang;
        document.documentElement.dir = langInfo.dir;
        document.body.style.fontFamily = `${langInfo.font}, sans-serif`;

        // حفظ في قاعدة البيانات (إذا كان المستخدم مسجل)
        try {
            await fetch('/api/user/language', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ language: newLang }),
            });
        } catch (error) {
            // تجاهل الأخطاء - اللغة محفوظة محلياً
        }

        setIsLoading(false);
    }, [loadTranslations]);

    /**
     * دالة الترجمة
     */
    const t = useCallback((key, namespace = 'common', params = {}) => {
        // key يمكن أن يكون "namespace:key" أو مجرد "key"
        let ns = namespace;
        let actualKey = key;

        if (key.includes(':')) {
            [ns, actualKey] = key.split(':');
        }

        // البحث عن الترجمة
        const nsTranslations = translations[ns] || {};
        let text = getNestedValue(nsTranslations, actualKey) || actualKey;

        // استبدال المتغيرات {{variable}}
        Object.keys(params).forEach(param => {
            text = text.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
        });

        return text;
    }, [translations]);

    /**
     * التهيئة الأولية
     */
    useEffect(() => {
        const initLanguage = async () => {
            setIsLoading(true);
            const detectedLang = await detectLanguage();
            setLanguage(detectedLang);
            await loadTranslations(detectedLang);

            // تحديث DOM
            const langInfo = SUPPORTED_LANGUAGES[detectedLang];
            document.documentElement.lang = detectedLang;
            document.documentElement.dir = langInfo.dir;

            setIsLoading(false);
        };

        initLanguage();
    }, [detectLanguage, loadTranslations]);

    return (
        <LanguageContext.Provider
            value={{
                language,
                languageInfo,
                isRTL,
                changeLanguage,
                t,
                detectLanguage,
                isLoading,
                supportedLanguages: SUPPORTED_LANGUAGES,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

/**
 * Hook لاستخدام سياق اللغة
 */
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

/**
 * Hook مختصر للترجمة
 */
export function useTranslation(namespace = 'common') {
    const { t, language, isRTL } = useLanguage();
    return {
        t: (key, params) => t(key, namespace, params),
        language,
        isRTL,
    };
}

// ============ Helper Functions ============

function getCookie(name) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, days) {
    if (typeof document === 'undefined') return;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export default LanguageContext;
