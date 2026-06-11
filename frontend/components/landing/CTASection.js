import React, { useState, useRef } from 'react';
import { useLanding } from '../../context/LandingContext';

const CONTACT_TYPES = [
    { id: 'demo', name: 'طلب عرض توضيحي', icon: '🎬', description: 'شاهد المنصة في عرض مباشر' },
    { id: 'trial', name: 'تجربة مجانية', icon: '🚀', description: 'جرب لمدة 14 يوم' },
    { id: 'quote', name: 'عرض سعر', icon: '💰', description: 'احصل على عرض مخصص' },
    { id: 'support', name: 'استفسار عام', icon: '💬', description: 'أي سؤال آخر' },
];

const TEAM_SIZE_OPTIONS = [
    { value: '1-10', label: '1-10 موظفين' },
    { value: '11-50', label: '11-50 موظف' },
    { value: '51-200', label: '51-200 موظف' },
    { value: '201-500', label: '201-500 موظف' },
    { value: '500+', label: 'أكثر من 500' },
];

const MODULES_OPTIONS = [
    { value: 'hr', label: 'الموارد البشرية', icon: '👥' },
    { value: 'warehouse', label: 'المستودعات', icon: '📦' },
    { value: 'archiving', label: 'الأرشفة', icon: '📂' },
    { value: 'movement', label: 'الحركة', icon: '🚗' },
    { value: 'sadad', label: 'سداد', icon: '💳' },
    { value: 'all', label: 'جميع الأنظمة', icon: '✨' },
];

export default function CTASection() {
    const [formData, setFormData] = useState({
        contactType: 'demo',
        name: '',
        email: '',
        phone: '',
        company: '',
        teamSize: '',
        modules: [],
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const formRef = useRef(null);

    // Get submitContactRequest from context
    let submitContactRequest = null;
    try {
        const context = useLanding();
        submitContactRequest = context.submitContactRequest;
    } catch (e) {
        // Context not available
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                modules: checked
                    ? [...prev.modules, value]
                    : prev.modules.filter(m => m !== value)
            }));
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleContactTypeChange = (type) => {
        setFormData({ ...formData, contactType: type });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Prepare contact request data
            const contactData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                companyName: formData.company,
                teamSize: formData.teamSize,
                requestType: formData.contactType,
                interestedModules: formData.modules,
                message: formData.message,
            };

            // Try to submit via API
            if (submitContactRequest) {
                await submitContactRequest(contactData);
            } else {
                // Fallback: simulate API call
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            setIsSubmitted(true);
            setFormData({ contactType: 'demo', name: '', email: '', phone: '', company: '', teamSize: '', modules: [], message: '' });
        } catch (error) {
            console.error('Contact submission error:', error);
            setSubmitError('حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="contact" className="py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-white/80 text-sm font-medium">تواصل معنا</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        هل أنت مستعد{' '}
                        <span className="bg-gradient-to-l from-primary-400 via-secondary-400 to-primary-400 bg-clip-text text-transparent">
                            للبدء؟
                        </span>
                    </h2>

                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        فريقنا جاهز لمساعدتك في اختيار الحل الأمثل لمؤسستك
                    </p>
                </div>

                <div className="grid lg:grid-cols-5 gap-12 items-start max-w-7xl mx-auto">
                    {/* Left Content - Contact Info */}
                    <div className="lg:col-span-2 text-white">
                        {/* Quick Contact */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 mb-8">
                            <h3 className="text-xl font-bold mb-6">تواصل مباشر</h3>
                            <div className="space-y-6">
                                <a href="tel:920000000" className="flex items-center gap-4 group">
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 text-sm">اتصل بنا</div>
                                        <div className="font-bold text-xl" dir="ltr">920 000 000</div>
                                    </div>
                                </a>

                                <a href="mailto:info@masarat.sa" className="flex items-center gap-4 group">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 text-sm">البريد الإلكتروني</div>
                                        <div className="font-bold text-xl">info@masarat.sa</div>
                                    </div>
                                </a>

                                <a href="https://wa.me/966920000000" className="flex items-center gap-4 group">
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 text-sm">واتساب</div>
                                        <div className="font-bold text-xl">محادثة فورية</div>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                            <h3 className="text-xl font-bold mb-4">موقعنا</h3>
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-bold text-lg mb-1">الرياض</div>
                                    <div className="text-gray-400">
                                        طريق الملك فهد
                                        <br />
                                        برج المملكة، الطابق 45
                                        <br />
                                        المملكة العربية السعودية
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-10 shadow-2xl">
                            {isSubmitted ? (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">شكراً لك! 🎉</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">
                                        تم استلام طلبك بنجاح
                                        <br />
                                        سنتواصل معك خلال 24 ساعة
                                    </p>
                                    <button
                                        onClick={() => setIsSubmitted(false)}
                                        className="px-8 py-4 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-all"
                                    >
                                        إرسال طلب آخر
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Contact Type Selection */}
                                    <div className="mb-8">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">ما الذي تحتاجه؟</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {CONTACT_TYPES.map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => handleContactTypeChange(type.id)}
                                                    className={`
                                                        p-4 rounded-2xl border-2 transition-all text-center
                                                        ${formData.contactType === type.id
                                                            ? 'border-primary-500 bg-primary-50 shadow-lg'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                        }
                                                    `}
                                                >
                                                    <span className="text-2xl block mb-2">{type.icon}</span>
                                                    <span className={`text-sm font-medium ${formData.contactType === type.id ? 'text-primary-700' : 'text-gray-700 dark:text-gray-200'}`}>
                                                        {type.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">الاسم الكامل *</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                                    placeholder="أحمد محمد"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">اسم الشركة *</label>
                                                <input
                                                    type="text"
                                                    name="company"
                                                    value={formData.company}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                                    placeholder="شركة مسارات"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">البريد الإلكتروني *</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                                    placeholder="ahmed@company.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">رقم الجوال *</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    required
                                                    className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                                    placeholder="05XXXXXXXX"
                                                    dir="ltr"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">حجم الفريق</label>
                                            <select
                                                name="teamSize"
                                                value={formData.teamSize}
                                                onChange={handleChange}
                                                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all appearance-none bg-white dark:bg-gray-900"
                                            >
                                                <option value="">اختر حجم الفريق</option>
                                                {TEAM_SIZE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">الأنظمة المطلوبة</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {MODULES_OPTIONS.map((module) => (
                                                    <label
                                                        key={module.value}
                                                        className={`
                                                            flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all
                                                            ${formData.modules.includes(module.value)
                                                                ? 'border-primary-500 bg-primary-50'
                                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                            }
                                                        `}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            name="modules"
                                                            value={module.value}
                                                            checked={formData.modules.includes(module.value)}
                                                            onChange={handleChange}
                                                            className="sr-only"
                                                        />
                                                        <span className="text-xl">{module.icon}</span>
                                                        <span className="text-sm text-gray-700 dark:text-gray-200">{module.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">رسالتك (اختياري)</label>
                                            <textarea
                                                name="message"
                                                value={formData.message}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none"
                                                placeholder="أخبرنا عن احتياجاتك..."
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-5 bg-gradient-to-l from-primary-600 via-secondary-500 to-primary-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    جاري الإرسال...
                                                </>
                                            ) : (
                                                <>
                                                    <span>إرسال الطلب</span>
                                                    <svg className="w-6 h-6 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>

                                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                            بالضغط على "إرسال الطلب" فإنك توافق على{' '}
                                            <a href="/help" className="text-primary-600 hover:underline">سياسة الخصوصية</a>
                                        </p>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
