/**
 * مكونات تحسين صفحة التوثيق
 * Documentation Enhancement Components
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MoonIcon,
    SunIcon,
    PrinterIcon,
    BookmarkIcon,
    ArrowDownTrayIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    CommandLineIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

import { fmtDate } from '../../utils/hijriDate';

// ============================================
// Prism.js Code Highlighter
// ============================================
export function CodeHighlighter({ code, language = 'javascript' }) {
    const [highlighted, setHighlighted] = useState(code);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Dynamic import for Prism
        import('prismjs').then((Prism) => {
            // Load languages
            import('prismjs/components/prism-csharp').catch(() => {});
            import('prismjs/components/prism-javascript').catch(() => {});
            import('prismjs/components/prism-json').catch(() => {});
            import('prismjs/components/prism-bash').catch(() => {});
            import('prismjs/components/prism-sql').catch(() => {});

            // Map language names
            const langMap = {
                'csharp': 'csharp',
                'cs': 'csharp',
                'javascript': 'javascript',
                'js': 'javascript',
                'json': 'json',
                'bash': 'bash',
                'sql': 'sql',
            };

            const prismLang = langMap[language] || 'javascript';

            setTimeout(() => {
                if (Prism.default?.languages?.[prismLang]) {
                    const html = Prism.default.highlight(
                        code,
                        Prism.default.languages[prismLang],
                        prismLang
                    );
                    setHighlighted(html);
                }
            }, 100);
        });
    }, [code, language]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group">
            <button
                onClick={handleCopy}
                className="absolute top-2 left-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="نسخ الكود"
            >
                {copied ? (
                    <span className="text-green-400 text-sm">✓</span>
                ) : (
                    <CommandLineIcon className="w-4 h-4 text-gray-300" />
                )}
            </button>
            <div className="absolute top-2 right-2 px-2 py-1 bg-gray-700 rounded text-xs text-gray-400">
                {language}
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 pt-10 rounded-xl overflow-x-auto text-sm leading-relaxed" dir="ltr">
                <code
                    className={`language-${language}`}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                />
            </pre>
        </div>
    );
}

// ============================================
// Mermaid Diagram Renderer
// ============================================
export function MermaidDiagram({ chart, title }) {
    const containerRef = useRef(null);
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        import('mermaid').then((mermaid) => {
            mermaid.default.initialize({
                startOnLoad: false,
                theme: 'default',
                flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true,
                    curve: 'cardinal',
                },
                themeVariables: {
                    primaryColor: '#3b82f6',
                    primaryTextColor: '#1e293b',
                    primaryBorderColor: '#2563eb',
                    lineColor: '#64748b',
                    secondaryColor: '#f1f5f9',
                    tertiaryColor: '#e2e8f0',
                },
            });

            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

            mermaid.default.render(id, chart).then((result) => {
                setSvg(result.svg);
                setError(null);
            }).catch((err) => {
                console.error('Mermaid error:', err);
                setError('خطأ في عرض الرسم البياني');
            });
        });
    }, [chart]);

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-center">
                {error}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            {title && (
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3 text-center">{title}</h4>
            )}
            <div
                ref={containerRef}
                className="flex justify-center overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: svg }}
            />
        </div>
    );
}

// ============================================
// Full-Text Search Component
// ============================================
export function FullTextSearch({ sections, content, onNavigate, isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const searchResults = [];
        const searchTerm = query.toLowerCase();

        // Search in section titles
        sections.forEach(section => {
            if (section.title.toLowerCase().includes(searchTerm)) {
                searchResults.push({
                    type: 'section',
                    id: section.id,
                    title: section.title,
                    icon: section.icon,
                    match: 'عنوان القسم',
                });
            }

            section.subsections?.forEach(sub => {
                if (sub.title.toLowerCase().includes(searchTerm)) {
                    searchResults.push({
                        type: 'subsection',
                        sectionId: section.id,
                        id: sub.id,
                        title: sub.title,
                        parent: section.title,
                        match: 'عنوان فرعي',
                    });
                }
            });
        });

        // Search in content
        Object.entries(content).forEach(([id, item]) => {
            const searchableText = [
                item.title,
                item.description,
                item.code,
                item.notes?.join(' '),
            ].filter(Boolean).join(' ').toLowerCase();

            if (searchableText.includes(searchTerm) && !searchResults.find(r => r.id === id)) {
                // Find matching text snippet
                const fullText = searchableText;
                const idx = fullText.indexOf(searchTerm);
                const start = Math.max(0, idx - 30);
                const end = Math.min(fullText.length, idx + searchTerm.length + 30);
                const snippet = (start > 0 ? '...' : '') +
                    fullText.slice(start, end) +
                    (end < fullText.length ? '...' : '');

                searchResults.push({
                    type: 'content',
                    id: id,
                    title: item.title,
                    snippet: snippet,
                    match: 'محتوى',
                });
            }
        });

        setResults(searchResults.slice(0, 15));
    }, [query, sections, content]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="ابحث في التوثيق..."
                        className="flex-1 text-lg outline-none"
                    />
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {results.length > 0 ? (
                        <div className="p-2">
                            {results.map((result, idx) => (
                                <button
                                    key={`${result.type}-${result.id}-${idx}`}
                                    onClick={() => {
                                        onNavigate(result.sectionId || result.id, result.id);
                                        onClose();
                                    }}
                                    className="w-full text-right p-3 hover:bg-blue-50 rounded-xl transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                                            {result.match}
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">{result.title}</span>
                                    </div>
                                    {result.parent && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            في: {result.parent}
                                        </div>
                                    )}
                                    {result.snippet && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                                            {result.snippet}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            لا توجد نتائج لـ "{query}"
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            ابدأ الكتابة للبحث...
                        </div>
                    )}
                </div>

                {/* Keyboard Hints */}
                <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">
                    <span>
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border">↑↓</kbd> للتنقل
                    </span>
                    <span>
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border">Enter</kbd> للفتح
                    </span>
                    <span>
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-900 rounded border">Esc</kbd> للإغلاق
                    </span>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Dark Mode Toggle
// ============================================
export function DarkModeToggle({ isDark, onToggle }) {
    return (
        <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'
            }`}
            title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
        >
            {isDark ? (
                <SunIcon className="w-5 h-5" />
            ) : (
                <MoonIcon className="w-5 h-5" />
            )}
        </button>
    );
}

// ============================================
// Bookmarks Manager
// ============================================
export function useBookmarks() {
    const [bookmarks, setBookmarks] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('doc-bookmarks');
        if (saved) {
            try {
                setBookmarks(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading bookmarks:', e);
            }
        }
    }, []);

    const saveBookmarks = (newBookmarks) => {
        setBookmarks(newBookmarks);
        localStorage.setItem('doc-bookmarks', JSON.stringify(newBookmarks));
    };

    const addBookmark = (id, title) => {
        if (!bookmarks.find(b => b.id === id)) {
            saveBookmarks([...bookmarks, { id, title, addedAt: new Date().toISOString() }]);
        }
    };

    const removeBookmark = (id) => {
        saveBookmarks(bookmarks.filter(b => b.id !== id));
    };

    const isBookmarked = (id) => {
        return bookmarks.some(b => b.id === id);
    };

    return { bookmarks, addBookmark, removeBookmark, isBookmarked };
}

export function BookmarkButton({ id, title, isBookmarked, onToggle }) {
    return (
        <button
            onClick={() => onToggle(id, title)}
            className={`p-2 rounded-lg transition-colors ${
                isBookmarked
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400 hover:text-amber-500'
            }`}
            title={isBookmarked ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
            {isBookmarked ? (
                <BookmarkSolidIcon className="w-5 h-5" />
            ) : (
                <BookmarkIcon className="w-5 h-5" />
            )}
        </button>
    );
}

export function BookmarksPanel({ bookmarks, onNavigate, onRemove }) {
    if (bookmarks.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BookmarkIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>لا توجد صفحات محفوظة</p>
                <p className="text-sm mt-1">انقر على ⭐ لحفظ الصفحات</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">الصفحات المحفوظة</h4>
            {bookmarks.map((bookmark) => (
                <div
                    key={bookmark.id}
                    className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
                >
                    <button
                        onClick={() => onNavigate(bookmark.id)}
                        className="flex-1 text-right text-amber-800 dark:text-amber-200 hover:underline"
                    >
                        {bookmark.title}
                    </button>
                    <button
                        onClick={() => onRemove(bookmark.id)}
                        className="p-1 hover:bg-amber-100 rounded"
                    >
                        <XMarkIcon className="w-4 h-4 text-amber-600" />
                    </button>
                </div>
            ))}
        </div>
    );
}

// ============================================
// Keyboard Shortcuts Hook
// ============================================
export function useKeyboardShortcuts({
    onSearch,
    onPrev,
    onNext,
    onToggleSidebar,
    onPrint,
}) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Ctrl/Cmd + K: Search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                onSearch?.();
            }

            // Ctrl/Cmd + P: Print
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                onPrint?.();
            }

            // Arrow keys for navigation
            if (e.key === 'ArrowLeft' || e.key === 'j') {
                onNext?.();
            }
            if (e.key === 'ArrowRight' || e.key === 'k') {
                onPrev?.();
            }

            // B: Toggle sidebar
            if (e.key === 'b' && !e.ctrlKey && !e.metaKey) {
                onToggleSidebar?.();
            }

            // Escape: Close modals handled separately
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSearch, onPrev, onNext, onToggleSidebar, onPrint]);
}

// ============================================
// Keyboard Shortcuts Help Modal
// ============================================
export function KeyboardShortcutsHelp({ isOpen, onClose }) {
    const shortcuts = [
        { key: 'Ctrl + K', description: 'فتح البحث' },
        { key: 'Ctrl + P', description: 'طباعة الصفحة' },
        { key: '← / J', description: 'القسم التالي' },
        { key: '→ / K', description: 'القسم السابق' },
        { key: 'B', description: 'إظهار/إخفاء القائمة' },
        { key: 'Esc', description: 'إغلاق النوافذ' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">اختصارات لوحة المفاتيح</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-3">
                    {shortcuts.map((shortcut) => (
                        <div key={shortcut.key} className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-300">{shortcut.description}</span>
                            <kbd className="px-3 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg text-sm font-mono">
                                {shortcut.key}
                            </kbd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================
// Print/Export Component
// ============================================
export function PrintExportButton({ contentRef, title }) {
    const [exporting, setExporting] = useState(false);

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // Add Arabic font support would require additional setup
            // For now, basic PDF export
            doc.text(title || 'التوثيق', 105, 20, { align: 'center' });
            doc.text('تم التصدير من منصة مسارات', 105, 30, { align: 'center' });
            doc.text(fmtDate(new Date()), 105, 40, { align: 'center' });

            doc.save(`${title || 'documentation'}.pdf`);
        } catch (err) {
            console.error('Error exporting PDF:', err);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handlePrint}
                className="p-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 rounded-lg transition-colors"
                title="طباعة"
            >
                <PrinterIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="p-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                title="تصدير PDF"
            >
                <ArrowDownTrayIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
        </div>
    );
}

// ============================================
// Related Sections Component
// ============================================
export function RelatedSections({ currentId, sections, content, onNavigate }) {
    const [related, setRelated] = useState([]);

    useEffect(() => {
        if (!currentId || !content[currentId]) {
            setRelated([]);
            return;
        }

        const current = content[currentId];
        const relatedItems = [];

        // Find sections in the same category
        sections.forEach(section => {
            section.subsections?.forEach(sub => {
                if (sub.id !== currentId && content[sub.id]) {
                    // Check for keyword matches
                    const currentKeywords = [
                        current.title,
                        ...(current.notes || []),
                    ].join(' ').toLowerCase();

                    const subKeywords = [
                        content[sub.id].title,
                        ...(content[sub.id].notes || []),
                    ].join(' ').toLowerCase();

                    // Simple relevance scoring
                    let score = 0;
                    const words = currentKeywords.split(/\s+/);
                    words.forEach(word => {
                        if (word.length > 3 && subKeywords.includes(word)) {
                            score++;
                        }
                    });

                    if (score > 0) {
                        relatedItems.push({
                            id: sub.id,
                            title: content[sub.id].title,
                            sectionTitle: section.title,
                            score,
                        });
                    }
                }
            });
        });

        // Sort by score and take top 3
        relatedItems.sort((a, b) => b.score - a.score);
        setRelated(relatedItems.slice(0, 3));
    }, [currentId, sections, content]);

    if (related.length === 0) return null;

    return (
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">أقسام ذات صلة</h4>
            <div className="flex flex-wrap gap-2">
                {related.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className="px-3 py-2 bg-white dark:bg-gray-900 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                    >
                        {item.title}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ============================================
// Navigation Controls
// ============================================
export function NavigationControls({ onPrev, onNext, prevTitle, nextTitle }) {
    return (
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {prevTitle ? (
                <button
                    onClick={onPrev}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 rounded-xl transition-colors"
                >
                    <ArrowUpIcon className="w-4 h-4 rotate-90" />
                    <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">السابق</div>
                        <div className="text-sm font-medium">{prevTitle}</div>
                    </div>
                </button>
            ) : (
                <div />
            )}

            {nextTitle ? (
                <button
                    onClick={onNext}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 rounded-xl transition-colors"
                >
                    <div className="text-left">
                        <div className="text-xs text-gray-500 dark:text-gray-400">التالي</div>
                        <div className="text-sm font-medium">{nextTitle}</div>
                    </div>
                    <ArrowDownIcon className="w-4 h-4 rotate-90" />
                </button>
            ) : (
                <div />
            )}
        </div>
    );
}

// ============================================
// Dark Mode CSS Variables
// ============================================
export const darkModeStyles = `
    .dark-mode {
        --bg-primary: #1e293b;
        --bg-secondary: #0f172a;
        --bg-card: #334155;
        --text-primary: #f8fafc;
        --text-secondary: #94a3b8;
        --border-color: #475569;
    }

    .dark-mode .bg-white {
        background-color: var(--bg-card) !important;
    }

    .dark-mode .bg-gray-50 {
        background-color: var(--bg-secondary) !important;
    }

    .dark-mode .text-gray-900 {
        color: var(--text-primary) !important;
    }

    .dark-mode .text-gray-600,
    .dark-mode .text-gray-500 {
        color: var(--text-secondary) !important;
    }

    .dark-mode .border-gray-100,
    .dark-mode .border-gray-200 {
        border-color: var(--border-color) !important;
    }

    @media print {
        .no-print {
            display: none !important;
        }
    }
`;

export default {
    CodeHighlighter,
    MermaidDiagram,
    FullTextSearch,
    DarkModeToggle,
    useBookmarks,
    BookmarkButton,
    BookmarksPanel,
    useKeyboardShortcuts,
    KeyboardShortcutsHelp,
    PrintExportButton,
    RelatedSections,
    NavigationControls,
};
