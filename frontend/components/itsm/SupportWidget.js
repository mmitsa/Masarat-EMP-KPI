import React, { useState, useEffect } from 'react';
import { useITSM, STATUS_LABELS, PRIORITY_LABELS, STATUS_COLORS, PRIORITY_COLORS, TICKET_PRIORITY } from '../../context/ITSMContext';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';

import { fmtDate } from '../../utils/hijriDate';

/**
 * ويدجت الدعم الفني العائم
 * يعرض للموظف خيارات طلب الدعم ومتابعة التذاكر
 */
export default function SupportWidget() {
    const {
        isWidgetOpen,
        widgetView,
        selectedTicket,
        myTickets,
        myAssets,
        categories,
        activeTickets,
        quickStats,
        loading,
        error,
        goToView,
        goBack,
        closeWidget,
        createTicket,
        rateTicket,
        addComment,
    } = useITSM();

    if (!isWidgetOpen) return null;

    return (
        <div className="
            fixed bottom-20 left-4
            w-96 max-h-[70vh]
            bg-white dark:bg-gray-800
            rounded-2xl shadow-2xl
            border border-gray-200 dark:border-gray-700
            overflow-hidden
            z-50
            animate-fadeIn
        ">
            {/* Header */}
            <div className="
                bg-gradient-to-r from-yellow-500 to-orange-600
                text-white px-4 py-3
                flex items-center justify-between
            ">
                <div className="flex items-center gap-2">
                    {widgetView !== 'main' && (
                        <button
                            onClick={goBack}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                    <h3 className="font-semibold">
                        {widgetView === 'main' && 'الدعم الفني'}
                        {widgetView === 'create' && 'طلب دعم جديد'}
                        {widgetView === 'tickets' && 'طلباتي'}
                        {widgetView === 'detail' && `تذكرة #${selectedTicket?.id}`}
                    </h3>
                </div>
                <button
                    onClick={closeWidget}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(70vh-56px)]">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <div className="p-4 text-center text-red-500">
                        <p>{error}</p>
                        <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                            إعادة المحاولة
                        </Button>
                    </div>
                ) : (
                    <>
                        {widgetView === 'main' && (
                            <MainView
                                quickStats={quickStats}
                                goToView={goToView}
                            />
                        )}
                        {widgetView === 'create' && (
                            <CreateTicketView
                                assets={myAssets}
                                categories={categories}
                                onSubmit={createTicket}
                                onCancel={() => goToView('main')}
                            />
                        )}
                        {widgetView === 'tickets' && (
                            <TicketsListView
                                tickets={myTickets}
                                onSelectTicket={(ticket) => goToView('detail', ticket)}
                            />
                        )}
                        {widgetView === 'detail' && selectedTicket && (
                            <TicketDetailView
                                ticket={selectedTicket}
                                onRate={rateTicket}
                                onAddComment={addComment}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * العرض الرئيسي
 */
function MainView({ quickStats, goToView }) {
    return (
        <div className="p-4 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {quickStats.active}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">طلبات نشطة</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {quickStats.resolved}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">تم الحل</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
                <button
                    onClick={() => goToView('create')}
                    className="
                        w-full flex items-center gap-3 p-4
                        bg-gradient-to-l from-yellow-500 to-orange-500
                        text-white rounded-xl
                        hover:from-yellow-600 hover:to-orange-600
                        transition-all duration-200
                    "
                >
                    <div className="p-2 bg-white/20 rounded-lg">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                    </div>
                    <div className="text-right">
                        <div className="font-semibold">طلب دعم جديد</div>
                        <div className="text-xs text-white/80">إبلاغ عن مشكلة أو طلب مساعدة</div>
                    </div>
                </button>

                <button
                    onClick={() => goToView('tickets')}
                    className="
                        w-full flex items-center gap-3 p-4
                        bg-gray-100 dark:bg-gray-700
                        text-gray-800 dark:text-gray-200 rounded-xl
                        hover:bg-gray-200 dark:hover:bg-gray-600
                        transition-all duration-200
                    "
                >
                    <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                    </div>
                    <div className="text-right flex-1">
                        <div className="font-semibold">طلباتي</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                            متابعة حالة الطلبات ({quickStats.total})
                        </div>
                    </div>
                    {quickStats.unread > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {quickStats.unread}
                        </span>
                    )}
                </button>
            </div>

            {/* Assets Preview */}
            {quickStats.assets > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                        <span className="font-medium text-sm">عهدتي</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        لديك {quickStats.assets} أصل/جهاز في العهدة
                    </p>
                </div>
            )}
        </div>
    );
}

/**
 * عرض إنشاء تذكرة جديدة
 */
function CreateTicketView({ assets, categories, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        priority: TICKET_PRIORITY.MEDIUM,
        categoryId: '',
        assetId: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.description.trim()) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        setSubmitting(true);
        const result = await onSubmit(formData);
        setSubmitting(false);

        if (!result.success) {
            alert(result.error || 'حدث خطأ في إنشاء التذكرة');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* الموضوع */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الموضوع <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="
                        w-full px-3 py-2 rounded-lg
                        border border-gray-300 dark:border-gray-600
                        bg-white dark:bg-gray-700
                        text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                        transition-colors
                    "
                    placeholder="وصف مختصر للمشكلة"
                    required
                />
            </div>

            {/* الوصف */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    وصف المشكلة <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="
                        w-full px-3 py-2 rounded-lg
                        border border-gray-300 dark:border-gray-600
                        bg-white dark:bg-gray-700
                        text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                        transition-colors resize-none
                    "
                    placeholder="اشرح المشكلة بالتفصيل..."
                    required
                />
            </div>

            {/* التصنيف */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    التصنيف
                </label>
                <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="
                        w-full px-3 py-2 rounded-lg
                        border border-gray-300 dark:border-gray-600
                        bg-white dark:bg-gray-700
                        text-gray-900 dark:text-gray-100
                        focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                        transition-colors
                    "
                >
                    <option value="">اختر التصنيف</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* الأصل/الجهاز */}
            {assets.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الجهاز/الأصل المتأثر
                    </label>
                    <select
                        value={formData.assetId}
                        onChange={(e) => setFormData(prev => ({ ...prev, assetId: e.target.value }))}
                        className="
                            w-full px-3 py-2 rounded-lg
                            border border-gray-300 dark:border-gray-600
                            bg-white dark:bg-gray-700
                            text-gray-900 dark:text-gray-100
                            focus:ring-2 focus:ring-yellow-500 focus:border-transparent
                            transition-colors
                        "
                    >
                        <option value="">اختر الجهاز (اختياري)</option>
                        {assets.map(asset => (
                            <option key={asset.id} value={asset.id}>
                                {asset.name} - {asset.serialNumber}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* الأولوية */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    الأولوية
                </label>
                <div className="flex gap-2">
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, priority: key }))}
                            className={`
                                flex-1 py-2 px-3 rounded-lg text-sm font-medium
                                transition-all duration-200
                                ${formData.priority === key
                                    ? PRIORITY_COLORS[key]
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }
                            `}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* الأزرار */}
            <div className="flex gap-2 pt-2">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="flex-1"
                    disabled={submitting}
                >
                    إلغاء
                </Button>
                <Button
                    type="submit"
                    variant="warning"
                    className="flex-1"
                    loading={submitting}
                    disabled={submitting}
                >
                    إرسال الطلب
                </Button>
            </div>
        </form>
    );
}

/**
 * عرض قائمة التذاكر
 */
function TicketsListView({ tickets, onSelectTicket }) {
    if (tickets.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">لا توجد طلبات دعم</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tickets.map(ticket => (
                <button
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    className="
                        w-full p-4 text-right
                        hover:bg-gray-50 dark:hover:bg-gray-700/50
                        transition-colors
                    "
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {ticket.subject}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                {ticket.description}
                            </p>
                        </div>
                        <span className={`
                            px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap
                            ${STATUS_COLORS[ticket.status]}
                        `}>
                            {STATUS_LABELS[ticket.status]}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>#{ticket.id}</span>
                        <span>{fmtDate(ticket.createdAt)}</span>
                        <span className={`px-1.5 py-0.5 rounded ${PRIORITY_COLORS[ticket.priority]}`}>
                            {PRIORITY_LABELS[ticket.priority]}
                        </span>
                    </div>
                </button>
            ))}
        </div>
    );
}

/**
 * عرض تفاصيل التذكرة
 */
function TicketDetailView({ ticket, onRate, onAddComment }) {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [comment, setComment] = useState('');
    const [showRating, setShowRating] = useState(false);

    const handleRate = async () => {
        if (rating === 0) {
            alert('يرجى اختيار تقييم');
            return;
        }
        const result = await onRate(ticket.id, rating, feedback);
        if (result.success) {
            setShowRating(false);
        }
    };

    const handleAddComment = async () => {
        if (!comment.trim()) return;
        const result = await onAddComment(ticket.id, comment);
        if (result.success) {
            setComment('');
        }
    };

    return (
        <div className="p-4 space-y-4">
            {/* معلومات التذكرة */}
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {ticket.subject}
                    </h4>
                    <span className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${STATUS_COLORS[ticket.status]}
                    `}>
                        {STATUS_LABELS[ticket.status]}
                    </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {ticket.description}
                </p>

                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        رقم التذكرة: #{ticket.id}
                    </span>
                    <span className={`px-2 py-1 rounded ${PRIORITY_COLORS[ticket.priority]}`}>
                        {PRIORITY_LABELS[ticket.priority]}
                    </span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {fmtDate(ticket.createdAt)}
                    </span>
                </div>

                {ticket.assignedTo && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                        <span>الفني المسؤول: {ticket.assignedTo.name}</span>
                    </div>
                )}

                {ticket.resolution && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span className="font-medium text-sm">الحل</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{ticket.resolution}</p>
                    </div>
                )}
            </div>

            {/* نموذج التقييم */}
            {ticket.status === 'resolved' && !ticket.rated && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                    {!showRating ? (
                        <button
                            onClick={() => setShowRating(true)}
                            className="w-full text-center text-yellow-600 dark:text-yellow-400 font-medium"
                        >
                            قيّم الخدمة
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                كيف تقيّم الخدمة المقدمة؟
                            </p>
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`text-2xl transition-transform hover:scale-110 ${
                                            star <= rating ? 'text-yellow-500' : 'text-gray-300'
                                        }`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="ملاحظات إضافية (اختياري)"
                                rows={2}
                                className="
                                    w-full px-3 py-2 rounded-lg text-sm
                                    border border-gray-300 dark:border-gray-600
                                    bg-white dark:bg-gray-700
                                    text-gray-900 dark:text-gray-100
                                    resize-none
                                "
                            />
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowRating(false)}
                                    className="flex-1"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    variant="warning"
                                    size="sm"
                                    onClick={handleRate}
                                    className="flex-1"
                                >
                                    إرسال التقييم
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* إضافة تعليق */}
            {!['closed', 'cancelled'].includes(ticket.status) && (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="أضف تعليقاً..."
                        className="
                            flex-1 px-3 py-2 rounded-lg text-sm
                            border border-gray-300 dark:border-gray-600
                            bg-white dark:bg-gray-700
                            text-gray-900 dark:text-gray-100
                        "
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddComment}
                        disabled={!comment.trim()}
                    >
                        إرسال
                    </Button>
                </div>
            )}

            {/* سجل التعليقات */}
            {ticket.comments && ticket.comments.length > 0 && (
                <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        التعليقات
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {ticket.comments.map((c, idx) => (
                            <div
                                key={idx}
                                className={`
                                    p-2 rounded-lg text-sm
                                    ${c.isStaff
                                        ? 'bg-blue-50 dark:bg-blue-900/20 mr-4'
                                        : 'bg-gray-100 dark:bg-gray-700 ml-4'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-xs">
                                        {c.isStaff ? 'الدعم الفني' : 'أنت'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(c.createdAt).toLocaleTimeString('ar-SA', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300">{c.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
