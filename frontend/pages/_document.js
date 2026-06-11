import { Html, Head, Main, NextScript } from 'next/document';

// Language configuration for SSR
const LANGUAGE_CONFIG = {
    ar: { dir: 'rtl', font: 'Cairo' },
    en: { dir: 'ltr', font: 'Inter' },
};

export default function Document({ __NEXT_DATA__ }) {
    // Get locale from Next.js data (defaults to 'ar')
    const locale = __NEXT_DATA__?.locale || 'ar';
    const langConfig = LANGUAGE_CONFIG[locale] || LANGUAGE_CONFIG.ar;

    return (
        <Html lang={locale} dir={langConfig.dir}>
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                {/* Arabic font - Cairo */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
                {/* English font - Inter */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
                {/* PWA Meta Tags */}
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#1d4ed8" />
                <meta name="application-name" content="مسارات" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="مسارات" />
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="msapplication-TileColor" content="#1d4ed8" />
                <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
            </Head>
            <body className={`font-${langConfig.font.toLowerCase()}`}>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
