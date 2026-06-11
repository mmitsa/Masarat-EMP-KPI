import '../styles/globals.css';
import '../styles/saudi-theme.css';
import '../styles/epm-saudi-identity.css';
import '../styles/prism-theme.css';
import '../styles/print-forms.css';
import '../lib/globalJsonParser'; // Global json() parser - patches Response.prototype.json()
import '../lib/suppressExpectedErrors'; // كتم أخطاء next-auth و API الاتصال المتوقعة
import 'leaflet/dist/leaflet.css';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { AppProvider } from '../context/AppContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ColorProvider } from '../context/ColorContext';
import { LanguageProvider } from '../context/LanguageContext';
import PasswordGuard from '../components/auth/PasswordGuard';
import ErrorBoundary from '../components/ErrorBoundary';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '../lib/queryClient';
import { useNavigationStore } from '../hooks/useNavigationLoading';
import { NavigationProgress } from '../components/layout/NavigationProgress';
import useAutoUpdate from '../hooks/useAutoUpdate';

// مراقبة التحديثات التلقائية — يعيد تحميل الصفحة عند وجود نسخة جديدة
function AutoUpdateHandler() {
    useAutoUpdate();
    return null;
}

function DevelopmentCacheReset() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development' || typeof window === 'undefined') {
            return;
        }

        const reset = async () => {
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map((registration) => registration.unregister()));
                }

                if ('caches' in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((key) => caches.delete(key)));
                }
            } catch (error) {
                console.warn('تعذر تنظيف كاش التطوير:', error);
            }
        };

        reset();
    }, []);

    return null;
}

// مراقبة أحداث التنقل في الراوتر
function RouterEventsHandler() {
    const router = useRouter();
    const startNavigation = useNavigationStore((s) => s.startNavigation);
    const endNavigation = useNavigationStore((s) => s.endNavigation);

    useEffect(() => {
        const handleStart = (url) => {
            if (url !== router.asPath) {
                startNavigation(url);
            }
        };
        const handleEnd = () => endNavigation();

        router.events.on('routeChangeStart', handleStart);
        router.events.on('routeChangeComplete', handleEnd);
        router.events.on('routeChangeError', handleEnd);

        return () => {
            router.events.off('routeChangeStart', handleStart);
            router.events.off('routeChangeComplete', handleEnd);
            router.events.off('routeChangeError', handleEnd);
        };
    }, [router]);

    return null;
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
    return (
        <SessionProvider session={session} refetchInterval={0} refetchOnWindowFocus={false}>
            <PasswordGuard>
            <ErrorBoundary>
                <QueryClientProvider client={queryClient}>
                    <ThemeProvider>
                        <ColorProvider>
                            <LanguageProvider>
                                <AppProvider>
                                    <Head>
                                        <meta name="viewport" content="width=device-width, initial-scale=1" />
                                        <meta name="description" content="نظام قياس الأداء الوظيفي" />
                                        <link rel="icon" href="/favicon.ico" />
                                    </Head>
                                    <NavigationProgress />
                                    <DevelopmentCacheReset />
                                    <RouterEventsHandler />
                                    <AutoUpdateHandler />
                                    <Component {...pageProps} />
                                </AppProvider>
                            </LanguageProvider>
                        </ColorProvider>
                    </ThemeProvider>
                    
                    {/* React Query Devtools - فقط في Development */}
                    {process.env.NODE_ENV === 'development' && (
                        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
                    )}
                </QueryClientProvider>
            </ErrorBoundary>
            </PasswordGuard>
        </SessionProvider>
    );
}
