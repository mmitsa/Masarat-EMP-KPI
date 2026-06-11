import React, { useState, useEffect } from 'react';
import { ContentCard, Button, Badge, PageLoading, EmptyState } from '../../components/ui';
import api from '../../lib/api';

// Module specific data
const MODULE_INFO = {
    users: {
        title: 'إدارة المستخدمين',
        icon: '👥',
        color: 'blue',
        description: 'إدارة حسابات المستخدمين والموظفين في النظام',
        features: [
            'إنشاء وتعديل حسابات المستخدمين',
            'إدارة صلاحيات الوصول',
            'تفعيل وتعطيل الحسابات',
            'إعادة تعيين كلمات المرور',
            'تتبع تسجيلات الدخول',
            'رفع المستخدمين بشكل جماعي'
        ],
        stats: [
            { label: 'إجمالي المستخدمين', value: 156, icon: '👥' },
            { label: 'المستخدمين النشطين', value: 142, icon: '✓' },
            { label: 'المستخدمين الجدد', value: 8, icon: 'new' },
            { label: 'المستخدمين المعطلين', value: 6, icon: 'pause' },
        ]
    },
    roles: {
        title: 'إدارة الأدوار',
        icon: '🔐',
        color: 'purple',
        description: 'تعريف الأدوار الوظيفية والصلاحيات المرتبطة بها',
        features: [
            'إنشاء أدوار وظيفية جديدة',
            'تخصيص الصلاحيات لكل دور',
            'تعديل الأدوار الموجودة',
            'حذف الأدوار غير المستخدمة',
            'عرض الموظفين في كل دور',
            'نسخ الأدوار والصلاحيات'
        ],
        stats: [
            { label: 'إجمالي الأدوار', value: 11, icon: '👔' },
            { label: 'الأدوار النشطة', value: 11, icon: '✓' },
            { label: 'الأدوار المخصصة', value: 9, icon: 'assign' },
            { label: 'متوسط الموظفين بالدور', value: 14, icon: 'avg' },
        ]
    },
    permissions: {
        title: 'إدارة الصلاحيات',
        icon: '🔑',
        color: 'green',
        description: 'تحديد والتحكم في صلاحيات الوصول لجميع الميزات',
        features: [
            'عرض جميع الصلاحيات المتاحة',
            'ربط الصلاحيات بالأدوار',
            'تعديل نطاق الصلاحيات',
            'تتبع استخدام الصلاحيات',
            'إنشاء صلاحيات مخصصة',
            'مراجعة سجل التغييرات'
        ],
        stats: [
            { label: 'إجمالي الصلاحيات', value: 85, icon: 'key' },
            { label: 'الصلاحيات المستخدمة', value: 78, icon: 'use' },
            { label: 'الصلاحيات غير المستخدمة', value: 7, icon: 'unused' },
            { label: 'صلاحيات الإدارة', value: 23, icon: 'admin' },
        ]
    },
    organization: {
        title: 'الهيكل التنظيمي',
        icon: '🏢',
        color: 'indigo',
        description: 'إدارة الأقسام والإدارات والجهات التنظيمية',
        features: [
            'إنشاء أقسام وإدارات جديدة',
            'تنظيم الهيكل التنظيمي',
            'تعيين المسؤولين للأقسام',
            'عرض الهيكل التنظيمي البياني',
            'تحديد الرؤساء والمرؤوسين',
            'إدارة الفروع والمكاتب'
        ],
        stats: [
            { label: 'إجمالي الأقسام', value: 24, icon: 'dept' },
            { label: 'الأقسام الرئيسية', value: 8, icon: 'main' },
            { label: 'الأقسام الفرعية', value: 16, icon: 'sub' },
            { label: 'موظفون بدون قسم', value: 3, icon: 'unassigned' },
        ]
    },
    positions: {
        title: 'المسميات الوظيفية',
        icon: '📋',
        color: 'yellow',
        description: 'إدارة الوظائف والمسميات الوظيفية المختلفة',
        features: [
            'إنشاء مسميات وظيفية جديدة',
            'تحديد متطلبات كل وظيفة',
            'ربط المسميات بالأقسام',
            'عرض الموظفين بكل وظيفة',
            'إدارة سلالم الرواتب',
            'تحديد المهارات المطلوبة'
        ],
        stats: [
            { label: 'إجمالي المسميات', value: 45, icon: 'position' },
            { label: 'المسميات المشغولة', value: 38, icon: 'filled' },
            { label: 'المسميات الشاغرة', value: 7, icon: 'vacant' },
            { label: 'مستويات الرواتب', value: 6, icon: 'salary' },
        ]
    },
    workflow: {
        title: 'سير العمل والموافقات',
        icon: '⚙️',
        color: 'cyan',
        description: 'تحديد مسارات الموافقة والعمليات التنظيمية',
        features: [
            'تحديد مسارات الموافقة',
            'إدارة مستويات الاعتماد',
            'تعيين الموافقين',
            'تحديد شروط الموافقة',
            'إعدادات التنبيهات والتذكيرات',
            'مراجعة سجل الموافقات'
        ],
        stats: [
            { label: 'إجمالي عمليات العمل', value: 8, icon: 'workflow' },
            { label: 'العمليات النشطة', value: 8, icon: 'active' },
            { label: 'الموافقات قيد الانتظار', value: 12, icon: 'pending' },
            { label: 'معدل الموافقة', value: '94%', icon: 'rate' },
        ]
    },
    logs: {
        title: 'السجلات والأنشطة',
        icon: '📊',
        color: 'orange',
        description: 'عرض وتحليل سجلات النشاط والتغييرات في النظام',
        features: [
            'عرض سجلات تسجيل الدخول',
            'تتبع تعديلات البيانات',
            'سجلات حذف البيانات',
            'تقارير الأنشطة',
            'البحث المتقدم في السجلات',
            'تصدير السجلات'
        ],
        stats: [
            { label: 'إجمالي السجلات', value: 1250, icon: 'logs' },
            { label: 'الأنشطة اليومية', value: 245, icon: 'daily' },
            { label: 'فترة الاحتفاظ', value: '90', icon: 'days' },
            { label: 'حجم السجلات', value: '2.5GB', icon: 'size' },
        ]
    },
    system: {
        title: 'إعدادات النظام',
        icon: '⚙️',
        color: 'gray',
        description: 'الإعدادات العامة والمتقدمة للنظام',
        features: [
            'إعدادات النسخ الاحتياطية',
            'إعدادات الأمان',
            'تكوين الإشعارات والبريد',
            'إدارة الجلسات',
            'إعدادات التصدير والاستيراد',
            'إعدادات الأداء والتخزين'
        ],
        stats: [
            { label: 'إصدار النظام', value: '2.5.1', icon: 'version' },
            { label: 'آخر نسخة احتياطية', value: 'اليوم', icon: 'backup' },
            { label: 'توفر النظام', value: '99.9%', icon: 'uptime' },
            { label: 'عدد التحديثات', value: 23, icon: 'updates' },
        ]
    },
    tenants: {
        title: 'إدارة المستاجرين',
        icon: '🏪',
        color: 'blue',
        description: 'إدارة المنشآت والعملاء في النظام',
        features: [
            'إنشاء حسابات مستاجر جديدة',
            'إدارة الاشتراكات والخطط',
            'تخصيص الوحدات لكل مستاجر',
            'إدارة الاستخدام والفواتير',
            'إعادة تعيين البيانات',
            'دعم متعدد الوحدات'
        ],
        stats: [
            { label: 'إجمالي المنشآت', value: 3, icon: 'tenants' },
            { label: 'الاشتراكات النشطة', value: 3, icon: 'active' },
            { label: 'الخطط المستخدمة', value: 2, icon: 'plans' },
            { label: 'إجمالي الموظفين', value: 156, icon: 'staff' },
        ]
    }
};

const ChevronLeftIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

export default function AdminModuleInfo({ moduleName, onBack }) {
    const moduleInfo = MODULE_INFO[moduleName];
    const [loading, setLoading] = useState(false);

    if (!moduleInfo) {
        return (
            <div className="flex items-center justify-center h-screen">
                <EmptyState
                    title="موديول غير معروف"
                    description={`الموديول ${moduleName} غير موجود`}
                />
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 mb-4 font-medium"
                >
                    <ChevronLeftIcon />
                    العودة إلى النظرة العامة
                </button>
                <div className="flex items-start gap-4">
                    <div className="text-4xl">{moduleInfo.icon}</div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{moduleInfo.title}</h1>
                        <p className="text-gray-600 dark:text-gray-300 mt-2">{moduleInfo.description}</p>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {moduleInfo.stats.map((stat, index) => (
                    <ContentCard key={index}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                            </div>
                            <div className="text-3xl">{stat.icon}</div>
                        </div>
                    </ContentCard>
                ))}
            </div>

            {/* Features */}
            <ContentCard>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">الميزات الرئيسية</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {moduleInfo.features.map((feature, index) => (
                        <div
                            key={index}
                            className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100"
                        >
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <span className="text-gray-700 dark:text-gray-200">{feature}</span>
                        </div>
                    ))}
                </div>
            </ContentCard>

            {/* Quick Actions */}
            <ContentCard>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">الإجراءات السريعة</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        👤 إضافة جديد
                    </button>
                    <button className="px-4 py-3 bg-gray-200 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 transition-colors font-medium">
                        📊 عرض التقارير
                    </button>
                    <button className="px-4 py-3 bg-gray-200 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 transition-colors font-medium">
                        ⚙️ الإعدادات
                    </button>
                </div>
            </ContentCard>

            {/* Info Box */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex gap-3">
                    <div className="text-yellow-600 text-xl">⚠️</div>
                    <div>
                        <p className="text-yellow-800 dark:text-yellow-200 font-medium">ملاحظة</p>
                        <p className="text-yellow-700 text-sm mt-1">
                            هذه الصفحة مخصصة لعرض معلومات الموديول فقط لمدير صاحب الصلاحية. يمكنك الوصول إلى إدارة مفصلة للموديول من خلال الضغط على الإجراءات السريعة أعلاه.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
