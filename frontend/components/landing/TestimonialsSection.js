import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLanding } from '../../context/LandingContext';

const DEFAULT_TESTIMONIALS = [
    {
        id: 1,
        name: 'أحمد الغامدي',
        nameEn: 'Ahmed Al-Ghamdi',
        role: 'مدير الموارد البشرية',
        company: 'شركة الرياض للتقنية',
        companyLogo: '🏢',
        avatar: '👨‍💼',
        rating: 5,
        text: 'منصة مسارات غيرت طريقة عملنا بالكامل. أصبحت إدارة 500+ موظف أسهل بكثير مع نظام الموارد البشرية المتكامل. التقارير الفورية وفرت علينا ساعات من العمل اليدوي.',
        highlight: 'وفرنا 80% من وقت إدارة شؤون الموظفين',
        modules: ['الموارد البشرية', 'التحليلات'],
    },
    {
        id: 2,
        name: 'فاطمة العتيبي',
        nameEn: 'Fatima Al-Otaibi',
        role: 'مدير المستودعات',
        company: 'مجموعة النهضة التجارية',
        companyLogo: '📦',
        avatar: '👩‍💼',
        rating: 5,
        text: 'نظام المستودعات ممتاز! تتبع المخزون أصبح فورياً، ونظام الباركود سهّل كل العمليات. التكامل مع نظام المشتريات وفر علينا الكثير من الوقت والجهد.',
        highlight: 'انخفاض نسبة الأخطاء في المخزون 95%',
        modules: ['المستودعات', 'الأرشفة'],
    },
    {
        id: 3,
        name: 'محمد السعيد',
        nameEn: 'Mohammed Al-Saeed',
        role: 'المدير التنفيذي',
        company: 'شركة الأمل للمقاولات',
        companyLogo: '🏗️',
        avatar: '👨‍💻',
        rating: 5,
        text: 'اخترنا مسارات لإدارة أسطول 150 مركبة، والنتائج فاقت التوقعات. التتبع المباشر وإدارة الصيانة وفرت لنا مبالغ كبيرة في تكاليف التشغيل.',
        highlight: 'توفير 30% من تكاليف الوقود',
        modules: ['إدارة الحركة', 'التحليلات'],
    },
    {
        id: 4,
        name: 'سارة القحطاني',
        nameEn: 'Sara Al-Qahtani',
        role: 'مدير المالية',
        company: 'مؤسسة النجاح التعليمية',
        companyLogo: '🎓',
        avatar: '👩‍🏫',
        rating: 5,
        text: 'نظام سداد متوافق 100% مع متطلبات هيئة الزكاة والضريبة. الفواتير الإلكترونية والتقارير المالية أصبحت جاهزة بضغطة زر. الدعم الفني ممتاز ويستجيب بسرعة.',
        highlight: 'التوافق الكامل مع ZATCA',
        modules: ['سداد', 'المالية'],
    },
    {
        id: 5,
        name: 'عبدالله الشمري',
        nameEn: 'Abdullah Al-Shammari',
        role: 'مدير تقنية المعلومات',
        company: 'مستشفى الحياة',
        companyLogo: '🏥',
        avatar: '👨‍⚕️',
        rating: 5,
        text: 'نظام الأرشفة الإلكترونية حل مشكلة كبيرة عندنا. أرشفنا آلاف الملفات الطبية مع إمكانية البحث الذكي. الأمان والخصوصية على أعلى مستوى.',
        highlight: 'أرشفة 50,000+ ملف في 3 أشهر',
        modules: ['الأرشفة', 'الدعم التقني'],
    },
    {
        id: 6,
        name: 'نورة البقمي',
        nameEn: 'Noura Al-Bugami',
        role: 'مدير الجودة',
        company: 'شركة التميز للخدمات',
        companyLogo: '⭐',
        avatar: '👩‍💼',
        rating: 5,
        text: 'نظام تقييم الأداء ساعدنا في تطبيق معايير الجودة بشكل منهجي. أصبح لدينا رؤية واضحة لأداء كل موظف مع خطط تطوير مخصصة.',
        highlight: 'تحسن أداء الفريق 40%',
        modules: ['إدارة الأداء', 'التحليلات'],
    },
];

const COMPANY_LOGOS = [
    { name: 'شركة الرياض', logo: '🏢' },
    { name: 'مجموعة النهضة', logo: '📦' },
    { name: 'شركة الأمل', logo: '🏗️' },
    { name: 'مؤسسة النجاح', logo: '🎓' },
    { name: 'مستشفى الحياة', logo: '🏥' },
    { name: 'شركة التميز', logo: '⭐' },
    { name: 'البنك الأهلي', logo: '🏦' },
    { name: 'أرامكو', logo: '⛽' },
];

function StarRating({ rating }) {
    return (
        <div className="flex gap-1">
            {[...Array(5)].map((_, idx) => (
                <svg
                    key={idx}
                    className={`w-5 h-5 ${idx < rating ? 'text-yellow-400' : 'text-gray-200'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function TestimonialCard({ testimonial, isActive }) {
    return (
        <div className={`
            bg-white dark:bg-gray-900 rounded-3xl p-8 transition-all duration-500 border
            ${isActive
                ? 'border-primary-200 shadow-2xl shadow-primary-500/10 scale-100'
                : 'border-gray-100 dark:border-gray-800 shadow-lg scale-95 opacity-60'
            }
        `}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center text-3xl">
                        {testimonial.avatar}
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{testimonial.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                        <p className="text-sm text-primary-600 font-medium">{testimonial.company}</p>
                    </div>
                </div>
                <StarRating rating={testimonial.rating} />
            </div>

            {/* Quote */}
            <div className="relative mb-6">
                <svg className="absolute -top-4 -right-2 w-12 h-12 text-primary-100" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed relative z-10 pr-8">
                    {testimonial.text}
                </p>
            </div>

            {/* Highlight */}
            <div className="bg-gradient-to-l from-green-50 to-emerald-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <span className="text-green-700 dark:text-green-300 font-bold">{testimonial.highlight}</span>
                </div>
            </div>

            {/* Modules Used */}
            <div className="flex flex-wrap gap-2">
                {testimonial.modules.map((module, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-full text-sm">
                        {module}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function TestimonialsSection() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const autoPlayRef = useRef(null);

    // Get data from context with fallback
    let contextData = { testimonials: [], partners: [] };
    try {
        contextData = useLanding();
    } catch (e) {
        // Context not available, use defaults
    }

    // Use context testimonials if available
    const TESTIMONIALS = useMemo(() => {
        const contextTestimonials = contextData.testimonials?.filter(t => t.isActive !== false);
        if (contextTestimonials?.length > 0) {
            return contextTestimonials.map((t, index) => ({
                id: t.id || index + 1,
                name: t.clientName,
                nameEn: t.clientNameEn,
                role: t.clientPosition,
                company: t.companyName,
                companyLogo: t.companyLogo || '🏢',
                avatar: t.avatarUrl || '👤',
                rating: t.rating || 5,
                text: t.contentAr || t.content,
                highlight: t.highlight || '',
                modules: t.modulesUsed || [],
            }));
        }
        return DEFAULT_TESTIMONIALS;
    }, [contextData.testimonials]);

    useEffect(() => {
        if (isAutoPlaying && TESTIMONIALS.length > 0) {
            autoPlayRef.current = setInterval(() => {
                setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
            }, 5000);
        }
        return () => clearInterval(autoPlayRef.current);
    }, [isAutoPlaying, TESTIMONIALS.length]);

    const handleDotClick = (index) => {
        setActiveIndex(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    return (
        <section id="testimonials" className="py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-l from-yellow-100 to-orange-100 rounded-full mb-4">
                        <span className="text-xl">⭐</span>
                        <span className="text-orange-600 text-sm font-medium">آراء عملائنا</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                        ماذا يقول{' '}
                        <span className="bg-gradient-to-l from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                            عملاؤنا
                        </span>
                    </h2>

                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        أكثر من 200 شركة تثق بمنصة مسارات لإدارة أعمالها
                    </p>
                </div>

                {/* Stats Bar */}
                <div className="flex flex-wrap items-center justify-center gap-8 mb-16">
                    <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">98%</div>
                        <div className="text-gray-500 dark:text-gray-400">نسبة الرضا</div>
                    </div>
                    <div className="w-px h-12 bg-gray-200 hidden md:block" />
                    <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">200+</div>
                        <div className="text-gray-500 dark:text-gray-400">عميل نشط</div>
                    </div>
                    <div className="w-px h-12 bg-gray-200 hidden md:block" />
                    <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">4.9</div>
                        <div className="text-gray-500 dark:text-gray-400">متوسط التقييم</div>
                    </div>
                    <div className="w-px h-12 bg-gray-200 hidden md:block" />
                    <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900 dark:text-white">50K+</div>
                        <div className="text-gray-500 dark:text-gray-400">مستخدم</div>
                    </div>
                </div>

                {/* Testimonials Carousel */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Navigation Arrows */}
                    <button
                        onClick={handlePrev}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-14 h-14 bg-white dark:bg-gray-900 rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-110 border border-gray-100 dark:border-gray-800"
                    >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-14 h-14 bg-white dark:bg-gray-900 rounded-full shadow-xl flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-110 border border-gray-100 dark:border-gray-800"
                    >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Cards Container */}
                    <div className="overflow-hidden px-4">
                        <div
                            className="flex transition-transform duration-500 ease-out"
                            style={{ transform: `translateX(${activeIndex * 100}%)` }}
                        >
                            {TESTIMONIALS.map((testimonial, index) => (
                                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                                    <TestimonialCard
                                        testimonial={testimonial}
                                        isActive={index === activeIndex}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dots */}
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {TESTIMONIALS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handleDotClick(index)}
                                className={`transition-all duration-300 rounded-full ${
                                    index === activeIndex
                                        ? 'w-8 h-3 bg-primary-500'
                                        : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Company Logos */}
                <div className="mt-20">
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-8">يثقون بنا</p>
                    <div className="flex flex-wrap items-center justify-center gap-8">
                        {COMPANY_LOGOS.map((company, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm dark:shadow-gray-900/20 hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer"
                            >
                                <span className="text-2xl">{company.logo}</span>
                                <span className="text-gray-600 dark:text-gray-300 font-medium">{company.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
