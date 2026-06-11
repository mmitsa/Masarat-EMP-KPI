/**
 * معاينة قرار الانتداب
 * Secondment Decision Preview Component
 */

import React, { useMemo } from 'react';
import {
    DocumentTextIcon,
    UserIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    ClipboardDocumentCheckIcon,
    ListBulletIcon,
    BookOpenIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';
import { ContentCard, Badge } from '../../../ui';
import { formatDateArabic } from '../../../../utils/hr-helpers';
import { ARABIC_ORDINALS, SECONDMENT_TYPES } from '../../../../constants/secondment-decision-articles';

const SecondmentDecisionPreview = ({
    decision,
    loading = false,
}) => {
    if (loading) {
        return (
            <ContentCard>
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">جاري توليد القرار...</p>
                </div>
            </ContentCard>
        );
    }

    if (!decision) {
        return (
            <ContentCard>
                <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                    <DocumentTextIcon className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg mb-2">لم يتم توليد القرار بعد</p>
                    <p className="text-sm">اختر الموظف واملأ بيانات الانتداب ثم اضغط على "توليد قرار الانتداب"</p>
                </div>
            </ContentCard>
        );
    }

    const {
        employee, authority, articles = [], clauses = [],
        decisionNumber, decisionDate,
        secondmentType, destination, city, mission,
        startDate, endDate, dailyAllowance,
    } = decision;

    // حساب عدد الأيام
    const numberOfDays = useMemo(() => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }, [startDate, endDate]);

    // اسم نوع الانتداب
    const secondmentTypeName = SECONDMENT_TYPES[secondmentType]?.label || secondmentType;

    // تنسيق التاريخ الهجري
    const formatHijriDate = (date) => {
        try {
            return new Date(date).toLocaleDateString('ar-SA-u-ca-islamic', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return date;
        }
    };

    return (
        <ContentCard
            title="معاينة قرار الانتداب"
            icon={<ClipboardDocumentCheckIcon className="w-5 h-5" />}
        >
            <div className="space-y-6">
                {/* ترويسة القرار */}
                <div className="text-center border-b pb-6">
                    <div className="text-lg font-bold text-gray-400 mb-2">
                        المملكة العربية السعودية
                    </div>
                    <div className="text-xl font-bold text-blue-800 dark:text-blue-200 mb-1">
                        منصة مسارات الموحدة
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">
                        إدارة الموارد البشرية
                    </div>
                </div>

                {/* عنوان القرار */}
                <div className="text-center py-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        قرار انتداب
                    </h2>
                    <div className="flex justify-center gap-4 mt-3 text-sm">
                        <span className="text-gray-600 dark:text-gray-300">
                            رقم القرار: <span className="font-bold text-gray-900 dark:text-white">{decisionNumber}</span>
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                            التاريخ: <span className="font-bold text-gray-900 dark:text-white">{formatDateArabic(decisionDate)}</span>
                        </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        الموافق: {formatHijriDate(decisionDate)}
                    </div>
                </div>

                {/* نص القرار */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-100">
                        بناءً على الصلاحيات المخولة لنا، ونظراً لمصلحة العمل ومتطلباته،
                    </p>
                    <p className="text-xl font-bold text-center text-blue-800 dark:text-blue-200 my-4">
                        تقرر ما يلي:
                    </p>
                </div>

                {/* بيانات الموظف */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <UserIcon className="w-4 h-4" />
                        بيانات الموظف
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoItem label="الاسم" value={employee?.fullName || employee?.nameAr} />
                        <InfoItem label="الرقم الوظيفي" value={employee?.employeeNumber} />
                        <InfoItem label="رقم الهوية" value={employee?.nationalId} />
                        <InfoItem label="المسمى الوظيفي" value={employee?.position} />
                        <InfoItem label="الإدارة / القسم" value={employee?.department} />
                    </div>
                </div>

                {/* تفاصيل الانتداب */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4" />
                        تفاصيل الانتداب
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoItem
                            label="نوع الانتداب"
                            value={
                                <Badge variant="primary">
                                    {secondmentTypeName}
                                </Badge>
                            }
                        />
                        <InfoItem
                            label="جهة الانتداب"
                            value={
                                <div className="flex items-center gap-1">
                                    <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                                    <span>{destination || '-'}</span>
                                </div>
                            }
                        />
                        <InfoItem label="المدينة" value={city} />
                        <InfoItem label="عدد الأيام" value={`${numberOfDays} أيام`} />
                        <InfoItem
                            label="تاريخ البداية"
                            value={
                                startDate ? (
                                    <div>
                                        <div>{formatDateArabic(startDate)}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{formatHijriDate(startDate)}</div>
                                    </div>
                                ) : '-'
                            }
                        />
                        <InfoItem
                            label="تاريخ النهاية"
                            value={
                                endDate ? (
                                    <div>
                                        <div>{formatDateArabic(endDate)}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{formatHijriDate(endDate)}</div>
                                    </div>
                                ) : '-'
                            }
                        />
                        <InfoItem
                            label="البدل اليومي"
                            value={dailyAllowance ? `${dailyAllowance} ريال` : '-'}
                        />
                    </div>

                    {mission && (
                        <div className="mt-4 pt-4 border-t">
                            <InfoItem label="المهمة" value={mission} />
                        </div>
                    )}
                </div>

                {/* بنود القرار */}
                {clauses.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <ListBulletIcon className="w-4 h-4" />
                            بنود القرار
                        </h3>
                        <ol className="space-y-3">
                            {clauses.map((clause, idx) => (
                                <li key={clause.id || idx} className="flex gap-3">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">
                                        {ARABIC_ORDINALS[idx] || `${idx + 1}.`}:
                                    </span>
                                    <span className="text-gray-800 dark:text-gray-100">{clause.text}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                )}

                {/* المواد المرجعية */}
                {articles.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <BookOpenIcon className="w-4 h-4" />
                            السند النظامي
                        </h3>
                        <ul className="space-y-3">
                            {articles.map((article, idx) => (
                                <li key={article.id || idx} className="flex gap-3">
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">&#8226;</span>
                                    <div>
                                        <span className="font-medium">المادة ({article.number}): </span>
                                        <span className="text-gray-700 dark:text-gray-200">{article.text}</span>
                                        {article.reference && (
                                            <span className="text-gray-500 dark:text-gray-400 text-sm"> - {article.reference}</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* الختام */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                    <p className="text-gray-700 dark:text-gray-200">
                        يُعمل بهذا القرار اعتباراً من تاريخه، وعلى الجهات المعنية تنفيذ ما جاء فيه كل فيما يخصه.
                    </p>
                </div>

                {/* التوقيعات */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
                    <SignatureBox
                        title="صاحب الصلاحية"
                        name={authority?.fullName || authority?.nameAr || '_______________'}
                        position={authority?.position || ''}
                    />
                    <SignatureBox
                        title="مدير الموارد البشرية"
                        name="_______________"
                        position=""
                    />
                    <SignatureBox
                        title="الموظف/ـة"
                        name={employee?.fullName || employee?.nameAr || '_______________'}
                        position=""
                    />
                </div>

                {/* الختم */}
                <div className="flex justify-center pt-6">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-400 text-sm">
                        ختم الجهة
                    </div>
                </div>
            </div>
        </ContentCard>
    );
};

// مكون عرض المعلومات
const InfoItem = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">{value || '-'}</span>
    </div>
);

// مكون التوقيع
const SignatureBox = ({ title, name, position }) => (
    <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-8">{title}</div>
        <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mx-8">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">التوقيع</div>
        </div>
        <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{name}</div>
        {position && <div className="text-xs text-gray-500 dark:text-gray-400">{position}</div>}
        <div className="mt-2 text-xs text-gray-400">التاريخ: _______________</div>
    </div>
);

export default SecondmentDecisionPreview;
