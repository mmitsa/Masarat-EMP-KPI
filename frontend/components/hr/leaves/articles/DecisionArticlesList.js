/**
 * قائمة مواد قرار الإجازة
 * Decision Articles List Component
 */

import React, { useState } from 'react';
import {
    DocumentTextIcon,
    PencilIcon,
    TrashIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    BookOpenIcon,
} from '@heroicons/react/24/outline';
import { Button, Badge, EmptyState } from '../../../ui';
import { LEAVE_TYPES, getLeaveTypeName } from '../../../../constants/leave-types';

const DecisionArticlesList = ({
    articles = [],
    onEdit,
    onDelete,
    loading = false,
    grouped = true,
}) => {
    const [expandedGroups, setExpandedGroups] = useState({});

    // تجميع المواد حسب نوع الإجازة
    const getGroupedArticles = () => {
        const groups = {};

        articles.forEach(article => {
            const leaveType = article.leaveType || 'all';
            const typeName = leaveType === 'all' ? 'عام' : getLeaveTypeName(leaveType);

            if (!groups[leaveType]) {
                groups[leaveType] = {
                    name: typeName,
                    leaveType,
                    articles: [],
                };
            }
            groups[leaveType].articles.push(article);
        });

        return Object.values(groups);
    };

    const toggleGroup = (leaveType) => {
        setExpandedGroups(prev => ({
            ...prev,
            [leaveType]: !prev[leaveType],
        }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">جاري تحميل المواد...</p>
            </div>
        );
    }

    if (articles.length === 0) {
        return (
            <EmptyState
                icon={<BookOpenIcon className="w-16 h-16" />}
                title="لا توجد مواد"
                description="لم يتم إضافة أي مواد قانونية بعد"
            />
        );
    }

    if (!grouped) {
        return (
            <div className="space-y-3">
                {articles.map((article) => (
                    <ArticleCard
                        key={article.id}
                        article={article}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        );
    }

    const groupedArticles = getGroupedArticles();

    return (
        <div className="space-y-4">
            {groupedArticles.map((group) => {
                const isExpanded = expandedGroups[group.leaveType] !== false;
                const leaveTypeInfo = LEAVE_TYPES[group.leaveType];

                return (
                    <div
                        key={group.leaveType}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                    >
                        {/* رأس المجموعة */}
                        <button
                            onClick={() => toggleGroup(group.leaveType)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                    leaveTypeInfo?.color
                                        ? `bg-${leaveTypeInfo.color}-500`
                                        : 'bg-blue-500'
                                }`} />
                                <span className="font-semibold text-gray-900 dark:text-white">{group.name}</span>
                                <Badge variant="gray" size="sm">
                                    {group.articles.length} مادة
                                </Badge>
                            </div>
                            {isExpanded ? (
                                <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            ) : (
                                <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            )}
                        </button>

                        {/* قائمة المواد */}
                        {isExpanded && (
                            <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
                                {group.articles.map((article) => (
                                    <ArticleCard
                                        key={article.id}
                                        article={article}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// مكون بطاقة المادة
const ArticleCard = ({ article, onEdit, onDelete }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = () => {
        onDelete?.(article);
        setShowDeleteConfirm(false);
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-800 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    {/* رقم المادة */}
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="primary" size="sm">
                            المادة {article.number}
                        </Badge>
                        {article.leaveType && article.leaveType !== 'all' && (
                            <Badge variant="outline" size="sm">
                                {getLeaveTypeName(article.leaveType)}
                            </Badge>
                        )}
                    </div>

                    {/* نص المادة */}
                    <p className="text-gray-800 dark:text-gray-100 mb-2 leading-relaxed">
                        {article.text}
                    </p>

                    {/* المرجع */}
                    {article.reference && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <BookOpenIcon className="w-4 h-4" />
                            <span>المرجع: {article.reference}</span>
                        </div>
                    )}
                </div>

                {/* الإجراءات */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit?.(article)}
                        icon={<PencilIcon className="w-4 h-4" />}
                    />

                    {showDeleteConfirm ? (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={handleDelete}
                            >
                                تأكيد
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                إلغاء
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(true)}
                            icon={<TrashIcon className="w-4 h-4 text-red-500" />}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DecisionArticlesList;
