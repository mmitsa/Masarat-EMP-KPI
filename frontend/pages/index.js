import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Home() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/epm');
    }, [router]);

    return (
        <>
            <Head>
                <title>قياس الأداء الوظيفي</title>
                <meta name="description" content="نظام قياس الأداء الوظيفي" />
            </Head>
            <main dir="rtl" className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
                جاري فتح نظام قياس الأداء الوظيفي...
            </main>
        </>
    );
}

