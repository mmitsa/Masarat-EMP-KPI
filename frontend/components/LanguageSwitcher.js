/**
 * Language Switcher Component - مكون تبديل اللغة
 * يتيح للمستخدم التبديل بين اللغات المدعومة
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

export default function LanguageSwitcher({ darkMode = false, compact = false }) {
    const { language, languageInfo, changeLanguage, isLoading } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = async (langCode) => {
        if (langCode !== language) {
            await changeLanguage(langCode);
        }
        setIsOpen(false);
    };

    // Compact mode (icon only)
    if (compact) {
        return (
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isLoading}
                    className={`p-2 rounded-xl transition-all duration-200
                        ${darkMode
                            ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
                            : 'hover:bg-gray-100 text-gray-500 dark:text-gray-400 hover:text-gray-700'}
                        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={languageInfo.nativeName}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                </button>

                {isOpen && (
                    <div className={`absolute left-0 mt-2 w-40 rounded-xl shadow-lg border py-1 z-50
                        ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                        {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors
                                    ${language === lang.code
                                        ? darkMode
                                            ? 'bg-blue-900/30 text-blue-400'
                                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                        : darkMode
                                            ? 'text-gray-300 hover:bg-gray-800'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-lg">{lang.flag}</span>
                                <span>{lang.nativeName}</span>
                                {language === lang.code && (
                                    <svg className="w-4 h-4 mr-auto" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Full mode (with text)
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                    ${darkMode
                        ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <span className="text-base">{languageInfo.flag}</span>
                <span className="hidden sm:inline">{languageInfo.nativeName}</span>
                <svg
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className={`absolute left-0 mt-2 w-48 rounded-xl shadow-lg border py-1 z-50
                    ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'}`}>
                    <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider
                        ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                        {language === 'ar' ? 'اختر اللغة' : 'Select Language'}
                    </div>

                    {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors
                                ${language === lang.code
                                    ? darkMode
                                        ? 'bg-blue-900/30 text-blue-400'
                                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    : darkMode
                                        ? 'text-gray-300 hover:bg-gray-800'
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <span className="text-xl">{lang.flag}</span>
                            <div className="flex-1 text-right">
                                <div className="font-medium">{lang.nativeName}</div>
                                <div className={`text-xs ${darkMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'}`}>
                                    {lang.name}
                                </div>
                            </div>
                            {language === lang.code && (
                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
