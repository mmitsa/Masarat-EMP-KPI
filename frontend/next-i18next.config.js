/**
 * next-i18next Configuration
 * إعدادات دعم اللغات المتعددة
 */

module.exports = {
    i18n: {
        defaultLocale: 'ar',
        locales: ['ar', 'en'],
        localeDetection: false, // سنتحكم بها يدوياً
    },
    fallbackLng: 'ar',
    ns: ['common', 'hr', 'warehouse', 'movement', 'finance', 'settings', 'auth'],
    defaultNS: 'common',
    localePath: typeof window === 'undefined'
        ? require('path').resolve('./public/locales')
        : '/locales',
    reloadOnPrerender: process.env.NODE_ENV === 'development',
};
